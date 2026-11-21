import type { WorkMode } from "../db/schema";
import type { AtsAdapter, NormalizedJob } from "./types";
import { isoDay, str } from "./text";

const MODES: Record<string, WorkMode> = { remote: "remote", hybrid: "hybrid", onsite: "onsite" };

// https://developers.ashbyhq.com/docs/public-job-posting-api — public, no auth.
export const ashby: AtsAdapter = {
  url: (slug) => `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`,
  parse(payload) {
    const jobs = (payload as { jobs?: unknown })?.jobs;
    if (!Array.isArray(jobs)) throw new Error("ashby: no jobs array");
    return jobs
      .filter((j: any) => j.isListed !== false)
      .map((j: any): NormalizedJob => {
        const secondary = Array.isArray(j.secondaryLocations) ? j.secondaryLocations.map((s: any) => s?.location) : [];
        return {
          source: "ashby",
          externalId: String(j.id),
          title: String(j.title).trim(),
          department: str(j.department) ?? str(j.team),
          location: [j.location, ...secondary].map(str).filter(Boolean).join("; ") || null,
          workMode: MODES[String(j.workplaceType ?? "").toLowerCase()] ?? (j.isRemote === true ? "remote" : null),
          description: str(j.descriptionPlain),
          applyUrl: str(j.applyUrl),
          sourceUrl: String(j.jobUrl),
          postedOn: isoDay(j.publishedAt),
        };
      });
  },
};
