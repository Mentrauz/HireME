import type { WorkMode } from "../db/schema";
import type { AtsAdapter, NormalizedJob } from "./types";
import { htmlToText, isoDay, str } from "./text";

const MODES: Record<string, WorkMode> = { remote: "remote", hybrid: "hybrid", onsite: "onsite", "on-site": "onsite" };

// https://github.com/lever/postings-api — public, no auth.
export const lever: AtsAdapter = {
  url: (slug) => `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`,
  parse(payload) {
    if (!Array.isArray(payload)) throw new Error("lever: payload is not an array");
    return payload.map((j: any): NormalizedJob => {
      const c = j.categories ?? {};
      const places: unknown[] = Array.isArray(c.allLocations) && c.allLocations.length ? c.allLocations : [c.location];
      // The body is split across an intro, titled lists and a closing section.
      const lists = Array.isArray(j.lists)
        ? j.lists.map((l: any) => `${l?.text ?? ""}\n${htmlToText(String(l?.content ?? ""))}`.trim())
        : [];
      const description = [str(j.descriptionPlain), ...lists, str(j.additionalPlain)].filter(Boolean).join("\n\n");
      return {
        source: "lever",
        externalId: String(j.id),
        title: String(j.text).trim(),
        department: str(c.team) ?? str(c.department),
        location: places.map(str).filter(Boolean).join("; ") || null,
        workMode: MODES[String(j.workplaceType ?? "").toLowerCase()] ?? null,
        description: description || null,
        applyUrl: str(j.applyUrl),
        sourceUrl: String(j.hostedUrl),
        postedOn: isoDay(j.createdAt),
      };
    });
  },
};
