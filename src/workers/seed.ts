// Loads seed/companies.json into the companies collection. Safe to re-run:
// a company is matched on its domain and its seed fields are refreshed.
import { readFile } from "node:fs/promises";
import { closeMongo, ensureIndexes, getCollections } from "../db/client";
import { ATS_PROVIDERS, STAGES, type AtsProvider, type Stage } from "../db/schema";

interface SeedCompany {
  name: string;
  domain: string;
  atsProvider?: AtsProvider;
  atsSlug?: string;
  careersUrl?: string;
  stage?: Stage;
  cohort?: string;
  seedSourceUrl?: string;
}

const rows: SeedCompany[] = JSON.parse(await readFile("seed/companies.json", "utf8"));

for (const row of rows) {
  if (!row.name || !row.domain) throw new Error(`seed row needs name and domain: ${JSON.stringify(row)}`);
  if (row.atsProvider && !ATS_PROVIDERS.includes(row.atsProvider)) throw new Error(`${row.domain}: unknown atsProvider ${row.atsProvider}`);
  if (row.stage && !STAGES.includes(row.stage)) throw new Error(`${row.domain}: unknown stage ${row.stage}`);
  const needs = row.atsProvider === "careers_page" ? "careersUrl" : row.atsProvider ? "atsSlug" : null;
  if (needs && !row[needs]) throw new Error(`${row.domain}: ${row.atsProvider} needs ${needs}`);
}

const c = await getCollections();
await ensureIndexes(c);
const now = new Date();
const result = await c.companies.bulkWrite(
  rows.map(({ domain, ...fields }) => ({
    updateOne: {
      filter: { domain: domain.toLowerCase() },
      update: {
        $set: { ...fields, updatedAt: now },
        $setOnInsert: { officeStatus: "unknown" as const, claimedByFounder: false, createdAt: now },
      },
      upsert: true,
    },
  })),
);
await closeMongo();
console.log(`seed: ${rows.length} companies (${result.upsertedCount} new)`);
