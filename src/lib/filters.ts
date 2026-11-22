// Search filters live in the URL so every result page can be shared and
// works without JavaScript. Pure functions only: no database imports here.
import { WORK_MODES, type WorkMode } from "../db/schema";
import { ROLE_FAMILIES, SENIORITIES } from "./classifyJob";

export type RoleFamily = (typeof ROLE_FAMILIES)[number];
export type Seniority = (typeof SENIORITIES)[number];

export interface SearchFilters {
  q: string;
  location: "bengaluru" | "anywhere";
  window: "30d" | "any";
  workMode: WorkMode[];
  seniority: Seniority[];
  roleFamily: RoleFamily[];
  stack: string[];
  founding: boolean;
  sort: "recent" | "roles";
}

export type SearchParams = Record<string, string | string[] | undefined>;

const all = (v: string | string[] | undefined): string[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const first = (v: string | string[] | undefined): string => all(v)[0] ?? "";
const allowed = <T extends string>(options: readonly T[], v: string | string[] | undefined): T[] =>
  [...new Set(all(v))].filter((x): x is T => (options as readonly string[]).includes(x));

export function parseFilters(p: SearchParams): SearchFilters {
  return {
    q: first(p.q).trim().slice(0, 80),
    location: first(p.location) === "anywhere" ? "anywhere" : "bengaluru",
    window: first(p.window) === "any" ? "any" : "30d",
    workMode: allowed(WORK_MODES, p.workMode),
    seniority: allowed(SENIORITIES, p.seniority),
    roleFamily: allowed(ROLE_FAMILIES, p.roleFamily),
    stack: [...new Set(all(p.stack).map((s) => s.trim().slice(0, 40)).filter(Boolean))].slice(0, 8),
    founding: first(p.founding) === "1",
    sort: first(p.sort) === "roles" ? "roles" : "recent",
  };
}

/** The URL for these filters with `change` applied. Defaults are left out. */
export function searchHref(f: SearchFilters, change: Partial<SearchFilters> = {}): string {
  const g = { ...f, ...change };
  const s = new URLSearchParams();
  if (g.q) s.set("q", g.q);
  if (g.location !== "bengaluru") s.set("location", g.location);
  if (g.window !== "30d") s.set("window", g.window);
  for (const key of ["workMode", "seniority", "roleFamily", "stack"] as const) for (const v of g[key]) s.append(key, v);
  if (g.founding) s.set("founding", "1");
  if (g.sort !== "recent") s.set("sort", g.sort);
  const query = s.toString();
  return query ? `/companies?${query}` : "/companies";
}

/** True when a filter that only classified roles can match is on. */
export const usesClassifierFields = (f: SearchFilters): boolean =>
  f.workMode.length + f.seniority.length + f.roleFamily.length + f.stack.length > 0 || f.founding;
