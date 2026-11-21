// Prints where the index stands against the Phase 1 gate in PLAN.md §4.
import { closeMongo, getCollections } from "../db/client";

const c = await getCollections();
const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

const [companies, hiring, liveJobs, lastRuns] = await Promise.all([
  c.companies.countDocuments(),
  c.companies.find({ lastHiringSignalAt: { $gte: cutoff } }).sort({ lastHiringSignalAt: -1 }).toArray(),
  c.jobs.countDocuments({ isActive: true }),
  c.sourceRuns.find().sort({ startedAt: -1 }).limit(5).toArray(),
]);

console.log(`companies: ${companies}`);
console.log(`with a hiring signal in the last 30 days: ${hiring.length} (gate: 100)`);
console.log(`live jobs: ${liveJobs}`);
for (const co of hiring) console.log(`  ${co.lastHiringSignalAt!.toISOString().slice(0, 10)}  ${co.name}`);
console.log("recent runs:");
for (const run of lastRuns) {
  console.log(`  ${run.startedAt.toISOString()}  ${run.source}  seen=${run.recordsSeen}  failed=${run.errors.length}${run.finishedAt ? "" : "  (did not finish)"}`);
}
await closeMongo();
