// Reconciles one company's board snapshot with the jobs collection and
// records the hiring signal (PLAN.md §3.4, "Active-hiring detection").
import { createHash } from "node:crypto";
import type { ObjectId } from "mongodb";
import type { NormalizedJob } from "../ats";
import type { Collections } from "../db/client";
import type { AtsProvider } from "../db/schema";

export interface SyncResult {
  seen: number;
  added: number;
  closed: number;
}

const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const asDate = (day: string) => new Date(`${day}T00:00:00Z`);

/**
 * `jobs` must be the complete current board for `source`: anything missing
 * from it is marked closed. `day` is the snapshot date, YYYY-MM-DD.
 */
export async function syncJobs(
  c: Collections,
  companyId: ObjectId,
  source: AtsProvider,
  jobs: NormalizedJob[],
  day: string,
): Promise<SyncResult> {
  const snapshot = asDate(day);
  let fresh: NormalizedJob[] = [];

  if (jobs.length) {
    const result = await c.jobs.bulkWrite(
      jobs.map(({ externalId, postedOn, workMode, title, department, location, description, applyUrl, sourceUrl }) => ({
        updateOne: {
          filter: { companyId, source, externalId },
          update: {
            $set: {
              title,
              department,
              location,
              description,
              applyUrl,
              sourceUrl,
              // The board's work mode wins when it gives one; otherwise a
              // value the classifier filled in later is left alone.
              ...(workMode ? { workMode } : {}),
              descriptionHash: description ? hash(description) : null,
              lastSeenOn: snapshot,
              isActive: true,
            },
            // A mode from the board replaces one the classifier inferred.
            ...(workMode ? { $unset: { workModeEvidence: "" } } : {}),
            $setOnInsert: {
              ...(workMode ? {} : { workMode: null }),
              postedOn: postedOn ? asDate(postedOn) : null,
              firstSeenOn: snapshot,
              isGhostFlag: false,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    const inserted = new Set(Object.keys(result.upsertedIds).map(Number));
    fresh = jobs.filter((_, i) => inserted.has(i));
  }

  const closed = await c.jobs.updateMany(
    { companyId, source, isActive: true, externalId: { $nin: jobs.map((j) => j.externalId) } },
    { $set: { isActive: false } },
  );

  // A new posting is a hiring event dated when the board says it was
  // published, so a first poll of old postings does not look like fresh hiring.
  if (fresh.length) {
    const latest = fresh.map((j) => j.postedOn ?? day).sort().at(-1)!;
    await c.companies.updateOne(
      { _id: companyId },
      { $max: { lastHiringSignalAt: asDate(latest) }, $set: { updatedAt: new Date() } },
    );
  }

  return { seen: jobs.length, added: fresh.length, closed: closed.modifiedCount };
}
