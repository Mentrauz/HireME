// Read queries for the web app.
import type { Filter, ObjectId } from "mongodb";
import { getCollections } from "../db/client";
import type { Company, Job, Stage, WorkMode } from "../db/schema";
import type { SearchFilters } from "./filters";

export const HIRING_WINDOW_DAYS = 30;
const BENGALURU = /bengaluru|bangalore/i;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type CompanyCore = Pick<Company, "_id" | "name" | "domain" | "stage" | "cohort" | "atsProvider" | "atsSlug" | "careersUrl" | "lastHiringSignalAt">;
const COMPANY_FIELDS = { name: 1, domain: 1, stage: 1, cohort: 1, atsProvider: 1, atsSlug: 1, careersUrl: 1, lastHiringSignalAt: 1 } as const;

export type RoleSummary = Pick<
  Job,
  "title" | "department" | "location" | "workMode" | "seniority" | "roleFamily" | "isFoundingRole" | "techStack" | "sourceUrl" | "postedOn" | "firstSeenOn"
> & { id: string };
const ROLE_FIELDS = {
  companyId: 1, title: 1, department: 1, location: 1, workMode: 1, seniority: 1, roleFamily: 1,
  isFoundingRole: 1, techStack: 1, sourceUrl: 1, postedOn: 1, firstSeenOn: 1,
} as const;

export interface CompanyResult extends Omit<CompanyCore, "_id"> {
  id: string;
  matchingRoles: number;
  liveRoles: number;
  /** The most common work mode among the matching roles that state one. */
  workMode: WorkMode | null;
  roles: RoleSummary[];
  stack: string[];
  hasFoundingRole: boolean;
  /** A new role in the last 7 days. */
  freshSignal: boolean;
}

export type FacetCounts = Record<string, number>;
export interface SearchResult {
  companies: CompanyResult[];
  matchingRoles: number;
  /** Roles in scope the classifier has not read yet; classifier filters skip them. */
  unreadRoles: number;
  facets: {
    workMode: FacetCounts;
    seniority: FacetCounts;
    roleFamily: FacetCounts;
    stack: { value: string; count: number }[];
    founding: number;
  };
}

type FacetKey = "workMode" | "seniority" | "roleFamily" | "stack" | "founding";

function tally<T extends string>(values: (T | null | undefined)[]): [T, number][] {
  const counts = new Map<T, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}

const toRole = (j: Job): RoleSummary => ({
  id: j._id.toHexString(),
  title: j.title,
  department: j.department,
  location: j.location,
  workMode: j.workMode,
  seniority: j.seniority,
  roleFamily: j.roleFamily,
  isFoundingRole: j.isFoundingRole,
  techStack: j.techStack,
  sourceUrl: j.sourceUrl,
  postedOn: j.postedOn,
  firstSeenOn: j.firstSeenOn,
});

export async function searchCompanies(f: SearchFilters): Promise<SearchResult> {
  const { companies, jobs } = await getCollections();
  const cutoff = new Date(Date.now() - HIRING_WINDOW_DAYS * 86_400_000);
  const pool = await companies
    .find(f.window === "30d" ? { lastHiringSignalAt: { $gte: cutoff } } : {}, { projection: COMPANY_FIELDS })
    .toArray();
  const byId = new Map(pool.map((c) => [c._id.toHexString(), c as CompanyCore]));

  // Location and keyword narrow every count; each facet then ignores its own
  // selection, so its counts show what picking another option would add.
  const scope: Filter<Job> = { isActive: true, companyId: { $in: pool.map((c) => c._id) } };
  if (f.location === "bengaluru") scope.location = BENGALURU;
  if (f.q) {
    const rx = new RegExp(escapeRegex(f.q), "i");
    const named = pool.filter((c) => rx.test(c.name)).map((c) => c._id);
    scope.$or = [{ title: rx }, { department: rx }, { techStack: rx }, { companyId: { $in: named } }];
  }
  const match = (skip?: FacetKey): Filter<Job> => {
    const m: Filter<Job> = { ...scope };
    if (skip !== "workMode" && f.workMode.length) m.workMode = { $in: f.workMode };
    if (skip !== "seniority" && f.seniority.length) m.seniority = { $in: f.seniority };
    if (skip !== "roleFamily" && f.roleFamily.length) m.roleFamily = { $in: f.roleFamily };
    if (skip !== "stack" && f.stack.length) m.techStack = { $all: f.stack };
    if (skip !== "founding" && f.founding) m.isFoundingRole = true;
    return m;
  };
  const facet = async (field: string, skip: FacetKey, unwind = false) =>
    jobs
      .aggregate<{ _id: string | boolean | null; n: number }>([
        { $match: match(skip) },
        ...(unwind ? [{ $unwind: `$${field}` }] : []),
        { $group: { _id: `$${field}`, n: { $sum: 1 } } },
        { $sort: { n: -1, _id: 1 } },
      ])
      .toArray();
  const asCounts = (rows: { _id: unknown; n: number }[]): FacetCounts =>
    Object.fromEntries(rows.filter((r) => typeof r._id === "string").map((r) => [r._id as string, r.n]));

  const [matching, live, unreadRoles, workMode, seniority, roleFamily, stack, founding] = await Promise.all([
    jobs.find(match(), { projection: ROLE_FIELDS }).sort({ postedOn: -1, firstSeenOn: -1 }).toArray(),
    jobs.aggregate<{ _id: ObjectId; n: number }>([{ $match: { isActive: true } }, { $group: { _id: "$companyId", n: { $sum: 1 } } }]).toArray(),
    jobs.countDocuments({ ...scope, classifiedHash: { $exists: false } }),
    facet("workMode", "workMode"),
    facet("seniority", "seniority"),
    facet("roleFamily", "roleFamily"),
    facet("techStack", "stack", true),
    facet("isFoundingRole", "founding"),
  ]);

  const liveByCompany = new Map(live.map((r) => [r._id.toHexString(), r.n]));
  const grouped = new Map<string, Job[]>();
  for (const j of matching) {
    const id = j.companyId.toHexString();
    grouped.set(id, [...(grouped.get(id) ?? []), j as Job]);
  }

  const results: CompanyResult[] = [...grouped].map(([id, roles]) => {
    const { _id, ...co } = byId.get(id)!;
    void _id;
    return {
      ...co,
      id,
      matchingRoles: roles.length,
      liveRoles: liveByCompany.get(id) ?? roles.length,
      workMode: tally(roles.map((r) => r.workMode))[0]?.[0] ?? null,
      roles: roles.slice(0, 3).map(toRole),
      stack: tally(roles.flatMap((r) => r.techStack ?? [])).slice(0, 4).map(([s]) => s),
      hasFoundingRole: roles.some((r) => r.isFoundingRole),
      freshSignal: (co.lastHiringSignalAt?.getTime() ?? 0) > Date.now() - 7 * 86_400_000,
    };
  });
  const signal = (c: CompanyResult) => c.lastHiringSignalAt?.getTime() ?? 0;
  results.sort((a, b) =>
    f.sort === "roles" ? b.matchingRoles - a.matchingRoles || signal(b) - signal(a) : signal(b) - signal(a) || b.matchingRoles - a.matchingRoles,
  );

  // Show the 12 most common stacks, plus any the visitor selected.
  const stackCounts = stack.filter((r) => typeof r._id === "string").map((r) => ({ value: r._id as string, count: r.n }));
  const shownStack = stackCounts.slice(0, 12);
  for (const s of f.stack) if (!shownStack.some((x) => x.value === s)) shownStack.push(stackCounts.find((x) => x.value === s) ?? { value: s, count: 0 });

  return {
    companies: results,
    matchingRoles: matching.length,
    unreadRoles,
    facets: {
      workMode: asCounts(workMode),
      seniority: asCounts(seniority),
      roleFamily: asCounts(roleFamily),
      stack: shownStack,
      founding: founding.find((r) => r._id === true)?.n ?? 0,
    },
  };
}

export interface CompanyProfile {
  company: Omit<CompanyCore, "_id"> & { stage?: Stage };
  roles: RoleSummary[];
  bengaluruRoles: number;
}

export async function companyProfile(domain: string): Promise<CompanyProfile | null> {
  const { companies, jobs } = await getCollections();
  const co = await companies.findOne({ domain: domain.toLowerCase() }, { projection: COMPANY_FIELDS });
  if (!co) return null;
  const roles = await jobs
    .find({ companyId: co._id, isActive: true }, { projection: ROLE_FIELDS })
    .sort({ postedOn: -1, firstSeenOn: -1 })
    .toArray();
  const { _id, ...company } = co as CompanyCore;
  void _id;
  return {
    company,
    roles: roles.map((r) => toRole(r as Job)),
    bengaluruRoles: roles.filter((r) => BENGALURU.test(r.location ?? "")).length,
  };
}
