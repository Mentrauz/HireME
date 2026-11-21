import type { AtsProvider, WorkMode } from "../db/schema";

/** One posting, in the shape the `job` table stores, whatever board it came from. */
export interface NormalizedJob {
  source: AtsProvider;
  externalId: string;
  title: string;
  department: string | null;
  location: string | null;
  workMode: WorkMode | null;
  description: string | null;
  applyUrl: string | null;
  sourceUrl: string;
  /** YYYY-MM-DD the board says the job was first published, if it says. */
  postedOn: string | null;
}

export interface AtsAdapter {
  url(slug: string): string;
  /** Throws if the payload is not this board's shape. */
  parse(payload: unknown): NormalizedJob[];
}
