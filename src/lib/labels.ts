// Display names and links shared by the web pages.
import type { AtsProvider, Company, Stage, WorkMode } from "../db/schema";
import type { RoleFamily, Seniority } from "./filters";

export const STAGE_LABELS: Record<Stage, string> = {
  stealth: "Stealth",
  pre_seed: "Pre-seed",
  seed: "Seed",
  series_a: "Series A",
  series_b_plus: "Series B+",
};

export const SOURCE_LABELS: Record<AtsProvider, string> = {
  greenhouse: "Greenhouse",
  ashby: "Ashby",
  lever: "Lever",
  keka: "Keka",
  careers_page: "Careers page",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = { remote: "Remote", hybrid: "Hybrid", onsite: "Onsite" };

export const SENIORITY_LABELS: Record<Seniority, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead",
  executive: "Executive",
};

export const ROLE_FAMILY_LABELS: Record<RoleFamily, string> = {
  engineering: "Engineering",
  ai_ml: "AI / ML",
  product: "Product",
  design: "Design",
  gtm: "Sales & marketing",
  ops: "Operations",
  other: "Other",
};

/** The public board a company's roles are read from. */
export function boardUrl(c: Pick<Company, "atsProvider" | "atsSlug" | "careersUrl">): string | null {
  const slug = c.atsSlug ? encodeURIComponent(c.atsSlug) : null;
  switch (c.atsProvider) {
    case "greenhouse":
      return slug && `https://job-boards.greenhouse.io/${slug}`;
    case "ashby":
      return slug && `https://jobs.ashbyhq.com/${slug}`;
    case "lever":
      return slug && `https://jobs.lever.co/${slug}`;
    case "keka":
      return c.atsSlug ? `https://${encodeURIComponent(c.atsSlug.split("/")[0]!)}.keka.com/careers/` : null;
    case "careers_page":
      return c.careersUrl ?? null;
    default:
      return null;
  }
}

/** Up to two initials for the monogram tile. */
export function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0]![0]! + words[1]![0]! : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

const dayFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const formatDay = (d: Date): string => dayFormat.format(d);

/** "today", "yesterday", "5 days ago"; a date once past the 30-day hiring window. */
export function sinceDay(d: Date, now = new Date()): string {
  const days = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - d.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days <= 30) return `${days} days ago`;
  return `on ${formatDay(d)}`;
}

// Job documents type these as plain strings; unknown values show as stored.
export const seniorityLabel = (v: string): string => SENIORITY_LABELS[v as Seniority] ?? v;
export const roleFamilyLabel = (v: string): string => ROLE_FAMILY_LABELS[v as RoleFamily] ?? v;
