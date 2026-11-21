// Raw responses are kept one file per source, day and target, so parsers can
// be re-run over history without fetching again (PLAN.md §3.2). Local disk
// for now; the R2 upload replaces this function when the bucket exists.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.env.RAW_DIR ?? "./.data/raw";

export async function saveRaw(source: string, day: string, target: string, body: unknown): Promise<void> {
  const dir = path.join(ROOT, source, day);
  await mkdir(dir, { recursive: true });
  const safe = target.replace(/[^a-z0-9._-]/gi, "_");
  await writeFile(path.join(dir, `${safe}.json`), JSON.stringify(body));
}

export const today = (): string => new Date().toISOString().slice(0, 10);
