// For companies with no supported job board: fetch the careers page once a
// day and treat a change in its visible text as a hiring event. The first
// poll only records a baseline. Pages rendered entirely by JavaScript return
// an empty shell and will never show a change; those need Playwright later.
import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import robotsParser from "robots-parser";
import { htmlToText } from "../ats/text";
import { closeMongo, ensureIndexes, getCollections } from "../db/client";
import { fetchText, mapLimit, USER_AGENT } from "../lib/http";
import { saveRaw, today } from "../lib/rawStore";

async function allowedByRobots(pageUrl: string): Promise<boolean> {
  const robotsUrl = new URL("/robots.txt", pageUrl).href;
  try {
    return robotsParser(robotsUrl, await fetchText(robotsUrl, { retries: 0 })).isAllowed(pageUrl, USER_AGENT) ?? true;
  } catch {
    return true; // No robots.txt means no restriction.
  }
}

const c = await getCollections();
await ensureIndexes(c);

const day = today();
const runId = new ObjectId();
await c.sourceRuns.insertOne({ _id: runId, source: "careers_page", startedAt: new Date(), recordsSeen: 0, errors: [] });

const companies = await c.companies.find({ atsProvider: "careers_page", careersUrl: { $type: "string" } }).toArray();
const errors: { target: string; message: string }[] = [];
let changed = 0;

await mapLimit(companies, 4, async (co) => {
  const url = co.careersUrl!;
  try {
    if (!(await allowedByRobots(url))) throw new Error("disallowed by robots.txt");
    const html = await fetchText(url);
    await saveRaw("careers_page", day, co.domain, { url, html });
    const careersHash = createHash("sha256").update(htmlToText(html)).digest("hex");
    if (careersHash === co.careersHash) return console.log(`${co.domain}: unchanged`);

    const observedOn = new Date(`${day}T00:00:00Z`);
    if (co.careersHash) {
      changed++;
      await c.signals.insertOne({ _id: new ObjectId(), companyId: co._id, kind: "careers_page_changed", observedOn, sourceUrl: url });
    }
    await c.companies.updateOne(
      { _id: co._id },
      { $set: { careersHash, updatedAt: new Date() }, ...(co.careersHash ? { $max: { lastHiringSignalAt: observedOn } } : {}) },
    );
    console.log(`${co.domain}: ${co.careersHash ? "changed" : "baseline recorded"}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push({ target: co.domain, message });
    console.error(`${co.domain}: FAILED ${message}`);
  }
});

await c.sourceRuns.updateOne({ _id: runId }, { $set: { finishedAt: new Date(), recordsSeen: companies.length, errors } });
await closeMongo();
console.log(`careers: ${companies.length} pages, ${changed} changed, ${errors.length} failed`);
