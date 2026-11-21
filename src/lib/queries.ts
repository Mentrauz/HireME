// Read queries for the web app.
import { getCollections } from "../db/client";
import type { Company } from "../db/schema";

export const HIRING_WINDOW_DAYS = 30;

export interface HiringCompany extends Pick<Company, "name" | "domain" | "stage" | "atsProvider"> {
  id: string;
  lastHiringSignalAt: Date;
  liveJobs: number;
  bengaluruJobs: number;
}

/** Companies whose last hiring signal is inside the window, newest first. */
export async function hiringCompanies(): Promise<HiringCompany[]> {
  const { companies } = await getCollections();
  const cutoff = new Date(Date.now() - HIRING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const rows = await companies
    .aggregate<Company & { liveJobs: number; bengaluruJobs: number }>([
      { $match: { lastHiringSignalAt: { $gte: cutoff } } },
      { $sort: { lastHiringSignalAt: -1 } },
      {
        $lookup: {
          from: "jobs",
          let: { id: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$companyId", "$$id"] }, { $eq: ["$isActive", true] }] } } },
            { $project: { blr: { $regexMatch: { input: { $ifNull: ["$location", ""] }, regex: "bengaluru|bangalore", options: "i" } } } },
          ],
          as: "live",
        },
      },
      {
        $addFields: {
          liveJobs: { $size: "$live" },
          bengaluruJobs: { $size: { $filter: { input: "$live", cond: "$$this.blr" } } },
        },
      },
      { $project: { live: 0 } },
    ])
    .toArray();

  return rows.map((r) => ({
    id: r._id.toHexString(),
    name: r.name,
    domain: r.domain,
    stage: r.stage,
    atsProvider: r.atsProvider,
    lastHiringSignalAt: r.lastHiringSignalAt!,
    liveJobs: r.liveJobs,
    bengaluruJobs: r.bengaluruJobs,
  }));
}
