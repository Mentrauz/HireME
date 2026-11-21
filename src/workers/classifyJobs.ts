// Classifies live postings whose description is new or has changed since
// they were last classified. `npm run classify -- 50` limits the run to 50.
// Stops cleanly when the LLM quota runs out; the rest wait for the next run.
import { ObjectId } from "mongodb";
import { closeMongo, getCollections } from "../db/client";
import type { Job } from "../db/schema";
import { classificationPrompt, cleanClassification, CLASSIFICATION_SCHEMA, type Classification } from "../lib/classifyJob";
import { extract, QuotaError } from "../lib/gemini";

// Every field the classifier may leave out, so a re-run clears stale values.
const OPTIONAL = [
  "seniority", "workModeEvidence", "officeDaysPerWeek", "blrHub", "ctcMinLpa", "ctcMaxLpa", "equityText", "preOfficeEvidence",
] as const satisfies readonly (keyof Classification)[];

const limit = Number(process.argv[2]) || 0;
const c = await getCollections();

const runId = new ObjectId();
await c.sourceRuns.insertOne({ _id: runId, source: "classify", startedAt: new Date(), recordsSeen: 0, errors: [] });

const pending = await c.jobs
  .find({ isActive: true, description: { $type: "string" }, $expr: { $ne: ["$classifiedHash", "$descriptionHash"] } })
  .sort({ postedOn: -1 })
  .limit(limit)
  .toArray();

const errors: { target: string; message: string }[] = [];
let done = 0;

for (const job of pending) {
  const text = { title: job.title, location: job.location, description: job.description! };
  try {
    const { workMode, ...fields } = cleanClassification(text, await extract(classificationPrompt(text), CLASSIFICATION_SCHEMA));
    const set: Partial<Job> = { ...fields, classifiedHash: job.descriptionHash! };
    const unset: Partial<Record<keyof Job, "">> = {};
    for (const key of OPTIONAL) if (fields[key] === undefined) unset[key] = "";

    // A work mode without evidence came from the board, which outranks the classifier.
    if (job.workMode && !job.workModeEvidence) {
      delete set.workModeEvidence;
      delete unset.workModeEvidence;
    } else {
      set.workMode = workMode ?? null;
    }
    await c.jobs.updateOne({ _id: job._id }, { $set: set, $unset: unset });
    done++;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (err instanceof QuotaError) {
      console.error(`quota reached after ${done} jobs: ${message}`);
      errors.push({ target: "quota", message });
      break;
    }
    errors.push({ target: job.sourceUrl, message });
    console.error(`${job.sourceUrl}: FAILED ${message}`);
  }
}

await c.sourceRuns.updateOne({ _id: runId }, { $set: { finishedAt: new Date(), recordsSeen: done, errors } });
await closeMongo();
console.log(`classify: ${done} of ${pending.length} pending jobs classified, ${errors.length} failed`);
