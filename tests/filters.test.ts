import { describe, expect, it } from "vitest";
import { parseFilters, searchHref, usesClassifierFields } from "../src/lib/filters";

describe("parseFilters", () => {
  it("defaults to Bengaluru roles from companies hiring in the last 30 days", () => {
    expect(parseFilters({})).toEqual({
      q: "",
      location: "bengaluru",
      window: "30d",
      workMode: [],
      seniority: [],
      roleFamily: [],
      stack: [],
      founding: false,
      sort: "recent",
    });
  });

  it("keeps known values, drops unknown and repeated ones", () => {
    const f = parseFilters({
      q: "  platform  ",
      workMode: ["remote", "remote", "moon"],
      seniority: "senior",
      roleFamily: ["ai_ml", "sales"],
      stack: ["Go", " ", "Go"],
      founding: "1",
      location: "anywhere",
      window: "any",
      sort: "roles",
    });
    expect(f).toMatchObject({
      q: "platform",
      workMode: ["remote"],
      seniority: ["senior"],
      roleFamily: ["ai_ml"],
      stack: ["Go"],
      founding: true,
      location: "anywhere",
      window: "any",
      sort: "roles",
    });
  });
});

describe("searchHref", () => {
  it("leaves defaults out of the URL", () => {
    expect(searchHref(parseFilters({}))).toBe("/");
  });

  it("round-trips through parseFilters", () => {
    const f = parseFilters({ q: "data", workMode: ["remote", "hybrid"], stack: "Python", sort: "roles" });
    const href = searchHref(f);
    expect(href).toBe("/?q=data&workMode=remote&workMode=hybrid&stack=Python&sort=roles");
    const params = new URLSearchParams(href.slice(2));
    const back = parseFilters(Object.fromEntries([...new Set(params.keys())].map((k) => [k, params.getAll(k)])));
    expect(back).toEqual(f);
  });

  it("removes one value without touching the rest", () => {
    const f = parseFilters({ workMode: ["remote", "hybrid"] });
    expect(searchHref(f, { workMode: ["hybrid"] })).toBe("/?workMode=hybrid");
  });
});

describe("usesClassifierFields", () => {
  it("is false for keyword and location only", () => {
    expect(usesClassifierFields(parseFilters({ q: "x", location: "anywhere" }))).toBe(false);
    expect(usesClassifierFields(parseFilters({ founding: "1" }))).toBe(true);
  });
});
