// Turns one job posting into the structured fields the filters need
// (PLAN.md §3.4). The model must quote the posting for every claim; a claim
// whose quote is not in the posting is discarded, so nothing invented is stored.
import { BLR_HUBS, WORK_MODES, type BlrHub, type WorkMode } from "../db/schema";

// "Other" is for founders to pick; the classifier only reports a hub the posting names.
const NAMED_HUBS = BLR_HUBS.filter((hub) => hub !== "Other");

export const ROLE_FAMILIES = ["engineering", "ai_ml", "product", "design", "gtm", "ops", "other"] as const;
export const SENIORITIES = ["intern", "junior", "mid", "senior", "lead", "executive"] as const;

const nullable = (schema: { type: string; [key: string]: unknown }) => ({ ...schema, type: [schema.type, "null"] });
const quote = (about: string) =>
  nullable({ type: "string", description: `The exact sentence or phrase from the posting that ${about}, copied word for word. null if there is none.` });

export const CLASSIFICATION_SCHEMA = {
  type: "object",
  properties: {
    roleFamily: { type: "string", enum: ROLE_FAMILIES, description: "gtm covers sales, marketing, partnerships and customer success. ops covers finance, HR, legal, support and operations." },
    seniority: nullable({ type: "string", enum: SENIORITIES }),
    workMode: nullable({ type: "string", enum: WORK_MODES, description: "Only if the posting says so. Naming a city is not enough to call a role onsite." }),
    workModeEvidence: quote("states the work mode"),
    officeDaysPerWeek: nullable({ type: "integer", description: "For hybrid roles that state it." }),
    blrHub: nullable({ type: "string", enum: NAMED_HUBS, description: "The Bengaluru neighbourhood of the office, only if the posting or its location names it." }),
    isFoundingRole: { type: "boolean", description: "True only if the posting calls this a founding role, a first hire in its function, or one of the first few employees." },
    ctcMinLpa: nullable({ type: "number", description: "Lowest annual pay in lakhs of rupees, only if the posting states pay in rupees. Convert a yearly rupee figure to lakhs. null for other currencies, hourly or monthly stipends." }),
    ctcMaxLpa: nullable({ type: "number" }),
    payEvidence: quote("states the pay"),
    equityText: quote("describes equity or ESOPs for this role, beyond a bare mention in a benefits list"),
    techStack: { type: "array", items: { type: "string" }, description: "Named languages, frameworks, databases, clouds and tools the role uses. Empty for non-technical roles." },
    preOfficeEvidence: quote("says the team has no office yet or works from a flat, apartment or hacker house"),
  },
  required: [
    "roleFamily", "seniority", "workMode", "workModeEvidence", "officeDaysPerWeek", "blrHub", "isFoundingRole",
    "ctcMinLpa", "ctcMaxLpa", "payEvidence", "equityText", "techStack", "preOfficeEvidence",
  ],
} as const;

export interface JobText {
  title: string;
  location: string | null;
  description: string;
}

// Long postings repeat company boilerplate at the end; the role is described first.
const MAX_CHARS = 12_000;

export const classificationPrompt = (job: JobText): string =>
  `Extract facts from this job posting. Use only what the posting says; when it does not say, answer null. Do not guess.

Title: ${job.title}
Location: ${job.location ?? "not given"}

Posting:
${job.description.slice(0, MAX_CHARS)}`;

export interface Classification {
  roleFamily: (typeof ROLE_FAMILIES)[number];
  seniority?: (typeof SENIORITIES)[number];
  workMode?: WorkMode;
  workModeEvidence?: string;
  officeDaysPerWeek?: number;
  blrHub?: BlrHub;
  isFoundingRole: boolean;
  ctcMinLpa?: number;
  ctcMaxLpa?: number;
  equityText?: string;
  techStack: string[];
  preOfficeEvidence?: string;
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** The quote, if the posting really contains it (ignoring case, spacing and punctuation). */
function quoted(haystack: string, value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const needle = squash(value);
  return needle.length >= 4 && haystack.includes(needle) ? value.trim() : undefined;
}

const oneOf = <T extends string>(allowed: readonly T[], value: unknown): T | undefined =>
  allowed.includes(value as T) ? (value as T) : undefined;

/** Checks the model's answer against the posting and drops anything unsupported. */
export function cleanClassification(job: JobText, raw: unknown): Classification {
  const r = (raw ?? {}) as Record<string, unknown>;
  const haystack = squash(`${job.title} ${job.location ?? ""} ${job.description}`);
  const result: Classification = {
    roleFamily: oneOf(ROLE_FAMILIES, r.roleFamily) ?? "other",
    isFoundingRole: r.isFoundingRole === true,
    techStack: Array.isArray(r.techStack)
      ? [...new Set(r.techStack.filter((t): t is string => typeof t === "string" && haystack.includes(squash(t)) && squash(t) !== ""))].slice(0, 20)
      : [],
  };
  const seniority = oneOf(SENIORITIES, r.seniority);
  if (seniority) result.seniority = seniority;

  const workModeEvidence = quoted(haystack, r.workModeEvidence);
  const workMode = oneOf(WORK_MODES, r.workMode);
  if (workMode && workModeEvidence) {
    result.workMode = workMode;
    result.workModeEvidence = workModeEvidence;
    const days = r.officeDaysPerWeek;
    if (workMode === "hybrid" && typeof days === "number" && days >= 1 && days <= 6) result.officeDaysPerWeek = days;
  }

  const hub = oneOf(NAMED_HUBS, r.blrHub);
  if (hub && hub.split(" / ").some((part) => haystack.includes(squash(part)))) result.blrHub = hub;

  const [min, max] = [r.ctcMinLpa, r.ctcMaxLpa];
  if (quoted(haystack, r.payEvidence) && typeof min === "number" && min > 0 && min < 1000) {
    result.ctcMinLpa = min;
    result.ctcMaxLpa = typeof max === "number" && max >= min && max < 1000 ? max : min;
  }

  const equityText = quoted(haystack, r.equityText);
  if (equityText) result.equityText = equityText;
  const preOfficeEvidence = quoted(haystack, r.preOfficeEvidence);
  if (preOfficeEvidence) result.preOfficeEvidence = preOfficeEvidence;
  return result;
}
