import type { AtsAdapter, NormalizedJob } from "./types";
import { decodeEntities, htmlToText, isoDay, str } from "./text";

// https://developers.greenhouse.io/job-board.html — public, no auth.
// Greenhouse has no workplace-type field, so workMode stays null here.
export const greenhouse: AtsAdapter = {
  url: (slug) => `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`,
  parse(payload) {
    const jobs = (payload as { jobs?: unknown })?.jobs;
    if (!Array.isArray(jobs)) throw new Error("greenhouse: no jobs array");
    return jobs.map((j: any): NormalizedJob => {
      const url = String(j.absolute_url);
      // `content` is HTML with its tags entity-escaped, so decode before stripping.
      const content = str(j.content);
      return {
        source: "greenhouse",
        externalId: String(j.id),
        title: String(j.title).trim(),
        department: str(j.departments?.[0]?.name),
        location: str(j.location?.name),
        workMode: null,
        description: content ? htmlToText(decodeEntities(content)) : null,
        applyUrl: url,
        sourceUrl: url,
        postedOn: isoDay(j.first_published),
      };
    });
  },
};
