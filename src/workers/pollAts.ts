// Daily pull of every seeded company's public job board (Greenhouse, Ashby,
// Lever). One failing company never stops the run; failures land in the
// sourceRuns document so they can be alerted on.
import { ObjectId } from "mongodb";
import { adapters, type BoardProvider } from "../ats";
import { closeMongo, ensureIndexes, getCollections } from "../db/client";
import { fetchJson, mapLimit } from "../lib/http";
import { saveRaw, today } from "../lib/rawStore";
import { syncJobs } from "../lib/syncJobs";

const c = await getCollections();
await ensureIndexes(c);

const day = today();
const runId = new ObjectId();
await c.sourceRuns.insertOne({ _id: runId, source: "ats", startedAt: new Date(), recordsSeen: 0, errors: [] });

const companies = await c.companies
  .find({ atsProvider: { $in: Object.keys(adapters) as BoardProvider[] }, atsSlug: { $type: "string" } })
  .toArray();

const errors: { target: string; message: string }[] = [];
const totals = { seen: 0, added: 0, closed: 0 };

await mapLimit(companies, 4, async (co) => {
  const provider = co.atsProvider as BoardProvider;
  const target = `${provider}/${co.atsSlug}`;
  try {
    const payload = await fetchJson(adapters[provider].url(co.atsSlug!));
    await saveRaw(provider, day, co.atsSlug!, payload);
    const result = await syncJobs(c, co._id, provider, adapters[provider].parse(payload, co.atsSlug!), day);
    for (const key of ["seen", "added", "closed"] as const) totals[key] += result[key];
    console.log(`${target}: ${result.seen} live, ${result.added} new, ${result.closed} closed`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push({ target, message });
    console.error(`${target}: FAILED ${message}`);
  }
});

await c.sourceRuns.updateOne({ _id: runId }, { $set: { finishedAt: new Date(), recordsSeen: totals.seen, errors } });
await closeMongo();
console.log(`ats: ${companies.length} companies, ${totals.seen} live jobs, ${totals.added} new, ${totals.closed} closed, ${errors.length} failed`);
if (errors.length === companies.length && companies.length) process.exitCode = 1;
