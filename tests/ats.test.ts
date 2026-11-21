// Fixtures are trimmed copies of real responses fetched on 2026-11-21.
import { describe, expect, it } from "vitest";
import { adapters } from "../src/ats";
import { htmlToText } from "../src/ats/text";

describe("greenhouse", () => {
  const payload = {
    jobs: [
      {
        absolute_url: "https://job-boards.eu.greenhouse.io/groww/jobs/4970739101",
        location: { name: "Bengaluru-VTP, India" },
        id: 4970739101,
        updated_at: "2026-09-14T03:52:53-04:00",
        title: "Assistant Manager - Internal Audit ",
        first_published: "2026-09-14T03:49:28-04:00",
        content: "&lt;div&gt;&lt;strong&gt;About Groww:&lt;/strong&gt;&lt;/div&gt;\n&lt;div&gt;We are a team&amp;nbsp;of builders&lt;/div&gt;",
        departments: [{ id: 4043270101, name: "Internal Controls" }],
      },
    ],
    meta: { total: 1 },
  };

  it("normalizes a posting", () => {
    expect(adapters.greenhouse.parse(payload)).toEqual([
      {
        source: "greenhouse",
        externalId: "4970739101",
        title: "Assistant Manager - Internal Audit",
        department: "Internal Controls",
        location: "Bengaluru-VTP, India",
        workMode: null,
        description: "About Groww:\n\nWe are a team of builders",
        applyUrl: "https://job-boards.eu.greenhouse.io/groww/jobs/4970739101",
        sourceUrl: "https://job-boards.eu.greenhouse.io/groww/jobs/4970739101",
        postedOn: "2026-09-14",
      },
    ]);
  });

  it("rejects a payload that is not a board", () => {
    expect(() => adapters.greenhouse.parse({ status: 404 })).toThrow(/no jobs array/);
  });
});

describe("ashby", () => {
  const posting = {
    id: "c6bb032c-6ac8-4b59-915c-d59b6f3a86f8",
    title: "AI Native Builder/Architect",
    department: "Engineering",
    team: "Engineering",
    location: "India",
    secondaryLocations: [{ location: "Bengaluru" }],
    publishedAt: "2026-10-26T09:57:21.274+00:00",
    isListed: true,
    isRemote: true,
    workplaceType: "Remote",
    jobUrl: "https://jobs.ashbyhq.com/atlan/c6bb032c-6ac8-4b59-915c-d59b6f3a86f8",
    applyUrl: "https://jobs.ashbyhq.com/atlan/c6bb032c-6ac8-4b59-915c-d59b6f3a86f8/application",
    descriptionPlain: "WHO WE ARE\n\nAtlan is building the context layer for enterprise AI.",
  };

  it("normalizes a posting and joins secondary locations", () => {
    const [job] = adapters.ashby.parse({ jobs: [posting], apiVersion: "1" });
    expect(job).toMatchObject({
      source: "ashby",
      externalId: posting.id,
      location: "India; Bengaluru",
      workMode: "remote",
      postedOn: "2026-10-26",
      sourceUrl: posting.jobUrl,
    });
  });

  it("maps OnSite and skips unlisted postings", () => {
    const jobs = adapters.ashby.parse({
      jobs: [
        { ...posting, id: "a", workplaceType: "OnSite", isRemote: false },
        { ...posting, id: "b", isListed: false },
      ],
    });
    expect(jobs.map((j) => [j.externalId, j.workMode])).toEqual([["a", "onsite"]]);
  });
});

describe("lever", () => {
  const payload = [
    {
      additionalPlain: "",
      categories: { commitment: "full time", department: "Prefr", location: "hyderabad", team: "finance", allLocations: ["hyderabad", "bangalore"] },
      createdAt: 1790573982021,
      descriptionPlain: "",
      id: "aa98a938-af3a-45f5-851d-966b2b5bad33",
      lists: [{ text: "What you will do", content: "<li>Own payables</li><li>Close the books</li>" }],
      text: "accounts payable manager",
      country: "IN",
      workplaceType: "onsite",
      hostedUrl: "https://jobs.lever.co/cred/aa98a938-af3a-45f5-851d-966b2b5bad33",
      applyUrl: "https://jobs.lever.co/cred/aa98a938-af3a-45f5-851d-966b2b5bad33/apply",
    },
  ];

  it("normalizes a posting and builds the description from its lists", () => {
    expect(adapters.lever.parse(payload)).toEqual([
      {
        source: "lever",
        externalId: "aa98a938-af3a-45f5-851d-966b2b5bad33",
        title: "accounts payable manager",
        department: "finance",
        location: "hyderabad; bangalore",
        workMode: "onsite",
        description: "What you will do\nOwn payables\nClose the books",
        applyUrl: "https://jobs.lever.co/cred/aa98a938-af3a-45f5-851d-966b2b5bad33/apply",
        sourceUrl: "https://jobs.lever.co/cred/aa98a938-af3a-45f5-851d-966b2b5bad33",
        postedOn: new Date(1790573982021).toISOString().slice(0, 10),
      },
    ]);
  });

  it("rejects the HTML error page Lever sometimes returns as a string", () => {
    expect(() => adapters.lever.parse("<html>")).toThrow(/not an array/);
  });
});

describe("htmlToText", () => {
  it("drops scripts, keeps block breaks and decodes entities", () => {
    expect(htmlToText("<p>A &amp; B</p><script>x()</script><p>C&#39;s</p>")).toBe("A & B\nC's");
  });
});
