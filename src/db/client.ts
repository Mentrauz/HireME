// The one MongoDB connection, shared by the Next.js app and the workers.
import { MongoClient, type Collection, type Db } from "mongodb";
import type {
  Company,
  ContactView,
  FundingRound,
  Job,
  Person,
  Signal,
  SourceRun,
  Submission,
  Suppression,
} from "./schema";

const DEFAULT_URI = "mongodb://127.0.0.1:27017/hireme";

// Next.js reloads modules in development; keeping the client on globalThis
// stops every reload from opening a new connection pool.
const cache = globalThis as typeof globalThis & { __mongo?: Promise<MongoClient> };

export function mongoClient(uri = process.env.MONGODB_URI || DEFAULT_URI): Promise<MongoClient> {
  return (cache.__mongo ??= new MongoClient(uri).connect());
}

export async function closeMongo(): Promise<void> {
  const pending = cache.__mongo;
  cache.__mongo = undefined;
  if (pending) await (await pending).close();
}

export interface Collections {
  companies: Collection<Company>;
  jobs: Collection<Job>;
  fundingRounds: Collection<FundingRound>;
  people: Collection<Person>;
  signals: Collection<Signal>;
  submissions: Collection<Submission>;
  contactViews: Collection<ContactView>;
  suppressions: Collection<Suppression>;
  sourceRuns: Collection<SourceRun>;
}

export function collections(db: Db): Collections {
  return {
    companies: db.collection("companies"),
    jobs: db.collection("jobs"),
    fundingRounds: db.collection("fundingRounds"),
    people: db.collection("people"),
    signals: db.collection("signals"),
    submissions: db.collection("submissions"),
    contactViews: db.collection("contactViews"),
    suppressions: db.collection("suppressions"),
    sourceRuns: db.collection("sourceRuns"),
  };
}

/** The database named in the connection string, or "hireme" when it names none. */
export async function getCollections(): Promise<Collections> {
  const client = await mongoClient();
  // The driver falls back to a database called "test" for a URI without a path.
  return collections(client.db(client.options.dbName === "test" ? "hireme" : undefined));
}

/** Idempotent; workers call it on start so a fresh database is usable. */
export async function ensureIndexes(c: Collections): Promise<void> {
  await Promise.all([
    c.companies.createIndex({ domain: 1 }, { unique: true }),
    c.companies.createIndex({ lastHiringSignalAt: -1 }),
    c.jobs.createIndex({ companyId: 1, source: 1, externalId: 1 }, { unique: true }),
    c.jobs.createIndex({ companyId: 1, isActive: 1 }),
    c.fundingRounds.createIndex({ companyId: 1, announcedOn: -1 }),
    c.people.createIndex({ companyId: 1 }),
    c.signals.createIndex({ companyId: 1, kind: 1, observedOn: -1 }),
    c.contactViews.createIndex({ userId: 1, viewedAt: -1 }),
    c.suppressions.createIndex({ emailOrDomain: 1 }),
    c.sourceRuns.createIndex({ source: 1, startedAt: -1 }),
  ]);
}
