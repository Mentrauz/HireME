// Finds which job board a company uses: `npm run probe -- slug1 slug2 ...`
// Prints one JSON line per board that answers with postings, including how
// many mention India, so a slug that belongs to some other company is easy
// to spot.
import { adapters, type BoardProvider } from "../src/ats";
import { fetchJson, mapLimit } from "../src/lib/http";

const INDIA = /bengaluru|bangalore|india|hyderabad|mumbai|gurgaon|gurugram|delhi|noida|pune|chennai/i;
const BLR = /bengaluru|bangalore/i;

const slugs = process.argv.slice(2);
const providers = Object.keys(adapters) as BoardProvider[];
const targets = slugs.flatMap((slug) => providers.map((provider) => ({ slug, provider })));

await mapLimit(targets, 4, async ({ slug, provider }) => {
  try {
    const jobs = adapters[provider].parse(await fetchJson(adapters[provider].url(slug)));
    if (!jobs.length) return;
    console.log(
      JSON.stringify({
        slug,
        provider,
        jobs: jobs.length,
        india: jobs.filter((j) => INDIA.test(j.location ?? "")).length,
        bengaluru: jobs.filter((j) => BLR.test(j.location ?? "")).length,
        newest: jobs.map((j) => j.postedOn).filter(Boolean).sort().at(-1) ?? null,
        sample: jobs[0]!.sourceUrl,
      }),
    );
  } catch {
    // A 404 means this board has no such slug; nothing to report.
  }
});
