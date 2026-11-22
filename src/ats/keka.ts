import type { AtsAdapter, NormalizedJob } from "./types";
import { htmlToText, isoDay, str } from "./text";

// Keka has no documented API. This is the public JSON its own careers widget
// loads; robots.txt on *.keka.com allows /careers. The slug is
// "<subdomain>/<board id>", where the board id is the GUID in the company's
// hosted page at https://<subdomain>.keka.com/careers/. Keka has no
// workplace-type field, so workMode stays null for the classifier.
const split = (slug = "") => {
  const [sub, board] = slug.split("/");
  if (!sub || !board) throw new Error(`keka: slug must be "<subdomain>/<board id>", got "${slug}"`);
  return { sub, board };
};

export const keka: AtsAdapter = {
  url(slug) {
    const { sub, board } = split(slug);
    return `https://${encodeURIComponent(sub)}.keka.com/careers/api/embedjobs/default/active/${encodeURIComponent(board)}`;
  },
  parse(payload, slug) {
    if (!Array.isArray(payload)) throw new Error("keka: payload is not an array");
    const { sub } = split(slug);
    return payload.map((j: any): NormalizedJob => {
      const url = `https://${sub}.keka.com/careers/jobdetails/${j.id}`;
      const places: unknown[] = Array.isArray(j.jobLocations) ? j.jobLocations.map((l: any) => l?.name) : [];
      // The pay range is shown on the posting but kept outside the body;
      // append it so the classifier can quote it.
      const salary = str(j.salaryRangeFormat);
      const body = [str(htmlToText(String(j.description ?? ""))), salary && `Salary: ${salary}`].filter(Boolean).join("\n\n");
      return {
        source: "keka",
        externalId: String(j.id),
        title: String(j.title).trim(),
        department: str(j.departmentName),
        location: places.map(str).filter(Boolean).join("; ") || null,
        workMode: null,
        description: body || null,
        applyUrl: url,
        sourceUrl: url,
        postedOn: isoDay(j.publishedOn),
      };
    });
  },
};
