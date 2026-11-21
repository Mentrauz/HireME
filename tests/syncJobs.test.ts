import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { NormalizedJob } from "../src/ats";
import { collections, ensureIndexes, type Collections } from "../src/db/client";
import { syncJobs } from "../src/lib/syncJobs";

let server: MongoMemoryServer;
let client: MongoClient;
let c: Collections;
let companyId: ObjectId;

beforeAll(async () => {
  server = await MongoMemoryServer.create();
  client = await new MongoClient(server.getUri()).connect();
  c = collections(client.db("test"));
  await ensureIndexes(c);
});

afterAll(async () => {
  await client.close();
  await server.stop();
});

beforeEach(async () => {
  await Promise.all([c.companies.deleteMany({}), c.jobs.deleteMany({})]);
  companyId = new ObjectId();
  await c.companies.insertOne({
    _id: companyId,
    name: "Acme",
    domain: "acme.test",
    officeStatus: "unknown",
    claimedByFounder: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

const posting = (externalId: string, postedOn: string | null, extra: Partial<NormalizedJob> = {}): NormalizedJob => ({
  source: "ashby",
  externalId,
  title: `Role ${externalId}`,
  department: null,
  location: "Bengaluru",
  workMode: null,
  description: `Description ${externalId}`,
  applyUrl: null,
  sourceUrl: `https://example.test/${externalId}`,
  postedOn,
  ...extra,
});

const signalDay = async () => (await c.companies.findOne({ _id: companyId }))?.lastHiringSignalAt?.toISOString().slice(0, 10);

describe("syncJobs", () => {
  it("dates the hiring signal by when the newest posting was published, not when it was first polled", async () => {
    const result = await syncJobs(c, companyId, "ashby", [posting("a", "2026-08-01"), posting("b", "2026-09-15")], "2026-11-21");
    expect(result).toEqual({ seen: 2, added: 2, closed: 0 });
    expect(await signalDay()).toBe("2026-09-15");
  });

  it("re-polling the same board adds nothing and leaves the signal alone", async () => {
    await syncJobs(c, companyId, "ashby", [posting("a", "2026-09-15")], "2026-11-20");
    const result = await syncJobs(c, companyId, "ashby", [posting("a", "2026-09-15")], "2026-11-21");
    expect(result).toEqual({ seen: 1, added: 0, closed: 0 });
    expect(await signalDay()).toBe("2026-09-15");
    const job = await c.jobs.findOne({ externalId: "a" });
    expect(job?.firstSeenOn.toISOString().slice(0, 10)).toBe("2026-11-20");
    expect(job?.lastSeenOn.toISOString().slice(0, 10)).toBe("2026-11-21");
  });

  it("a new posting moves the signal forward; an undated one counts from the poll day", async () => {
    await syncJobs(c, companyId, "ashby", [posting("a", "2026-09-15")], "2026-11-20");
    await syncJobs(c, companyId, "ashby", [posting("a", "2026-09-15"), posting("b", null)], "2026-11-21");
    expect(await signalDay()).toBe("2026-11-21");
  });

  it("an older posting appearing later never moves the signal backwards", async () => {
    await syncJobs(c, companyId, "ashby", [posting("a", "2026-11-10")], "2026-11-20");
    await syncJobs(c, companyId, "ashby", [posting("a", "2026-11-10"), posting("b", "2026-10-01")], "2026-11-21");
    expect(await signalDay()).toBe("2026-11-10");
  });

  it("closes postings that left the board and reopens one that returns", async () => {
    await syncJobs(c, companyId, "ashby", [posting("a", "2026-11-01"), posting("b", "2026-11-01")], "2026-11-19");
    expect(await syncJobs(c, companyId, "ashby", [posting("a", "2026-11-01")], "2026-11-20")).toEqual({ seen: 1, added: 0, closed: 1 });
    expect((await c.jobs.findOne({ externalId: "b" }))?.isActive).toBe(false);

    expect(await syncJobs(c, companyId, "ashby", [], "2026-11-21")).toEqual({ seen: 0, added: 0, closed: 1 });
    await syncJobs(c, companyId, "ashby", [posting("b", "2026-11-01")], "2026-11-22");
    expect((await c.jobs.findOne({ externalId: "b" }))?.isActive).toBe(true);
    expect(await c.jobs.countDocuments()).toBe(2);
  });

  it("only touches jobs from the same source", async () => {
    await syncJobs(c, companyId, "lever", [posting("x", "2026-11-01", { source: "lever" })], "2026-11-20");
    await syncJobs(c, companyId, "ashby", [posting("a", "2026-11-01")], "2026-11-21");
    expect((await c.jobs.findOne({ externalId: "x" }))?.isActive).toBe(true);
  });

  it("keeps a work mode set after the fact when the board gives none, and takes the board's when it does", async () => {
    await syncJobs(c, companyId, "ashby", [posting("a", "2026-11-01")], "2026-11-20");
    expect((await c.jobs.findOne({ externalId: "a" }))?.workMode).toBeNull();
    await c.jobs.updateOne({ externalId: "a" }, { $set: { workMode: "hybrid" } });

    await syncJobs(c, companyId, "ashby", [posting("a", "2026-11-01")], "2026-11-21");
    expect((await c.jobs.findOne({ externalId: "a" }))?.workMode).toBe("hybrid");

    await syncJobs(c, companyId, "ashby", [posting("a", "2026-11-01", { workMode: "remote" })], "2026-11-22");
    expect((await c.jobs.findOne({ externalId: "a" }))?.workMode).toBe("remote");
  });

  it("updates an edited posting in place and rehashes its description", async () => {
    await syncJobs(c, companyId, "ashby", [posting("a", "2026-11-01")], "2026-11-20");
    const before = await c.jobs.findOne({ externalId: "a" });
    await syncJobs(c, companyId, "ashby", [posting("a", "2026-11-01", { title: "Renamed", description: "New text" })], "2026-11-21");
    const after = await c.jobs.findOne({ externalId: "a" });
    expect(after?.title).toBe("Renamed");
    expect(after?.descriptionHash).not.toBe(before?.descriptionHash);
    expect(after?._id).toEqual(before?._id);
  });
});
