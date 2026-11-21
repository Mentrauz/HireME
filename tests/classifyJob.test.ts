import { describe, expect, it } from "vitest";
import { cleanClassification, type JobText } from "../src/lib/classifyJob";

const job: JobText = {
  title: "Founding Engineer",
  location: "Bengaluru",
  description:
    "We are a 4-person team working out of a flat in HSR Layout. This is a hybrid role: 3 days a week in office. " +
    "You will build our API in TypeScript and Postgres. Compensation: ₹30–45 LPA plus 0.5% - 1.5% ESOP.",
};

const answer = {
  roleFamily: "engineering",
  seniority: "senior",
  workMode: "hybrid",
  workModeEvidence: "This is a hybrid role: 3 days a week in office.",
  officeDaysPerWeek: 3,
  blrHub: "HSR Layout",
  isFoundingRole: true,
  ctcMinLpa: 30,
  ctcMaxLpa: 45,
  payEvidence: "Compensation: ₹30–45 LPA",
  equityText: "0.5% - 1.5% ESOP",
  techStack: ["TypeScript", "Postgres"],
  preOfficeEvidence: "working out of a flat in HSR Layout",
};

describe("cleanClassification", () => {
  it("keeps every claim the posting supports", () => {
    expect(cleanClassification(job, answer)).toEqual({
      roleFamily: "engineering",
      seniority: "senior",
      workMode: "hybrid",
      workModeEvidence: "This is a hybrid role: 3 days a week in office.",
      officeDaysPerWeek: 3,
      blrHub: "HSR Layout",
      isFoundingRole: true,
      ctcMinLpa: 30,
      ctcMaxLpa: 45,
      equityText: "0.5% - 1.5% ESOP",
      techStack: ["TypeScript", "Postgres"],
      preOfficeEvidence: "working out of a flat in HSR Layout",
    });
  });

  it("matches quotes despite case, spacing and punctuation differences", () => {
    const result = cleanClassification(job, { ...answer, workModeEvidence: "this is a HYBRID role - 3 days a week   in office" });
    expect(result.workMode).toBe("hybrid");
  });

  it("drops a work mode whose quote is not in the posting", () => {
    const result = cleanClassification(job, { ...answer, workMode: "remote", workModeEvidence: "Work from anywhere in India." });
    expect(result.workMode).toBeUndefined();
    expect(result.workModeEvidence).toBeUndefined();
    expect(result.officeDaysPerWeek).toBeUndefined();
  });

  it("drops pay without a supporting quote, and pay that is not a sane LPA figure", () => {
    expect(cleanClassification(job, { ...answer, payEvidence: "Salary of 30 to 45 lakhs" }).ctcMinLpa).toBeUndefined();
    expect(cleanClassification(job, { ...answer, ctcMinLpa: 3000000, ctcMaxLpa: 4500000 }).ctcMinLpa).toBeUndefined();
    expect(cleanClassification(job, { ...answer, ctcMaxLpa: null })).toMatchObject({ ctcMinLpa: 30, ctcMaxLpa: 30 });
  });

  it("drops a hub, stack entries, equity and pre-office claims the posting does not contain", () => {
    const result = cleanClassification(job, {
      ...answer,
      blrHub: "Indiranagar",
      techStack: ["TypeScript", "Kubernetes", "TypeScript"],
      equityText: "Generous equity",
      preOfficeEvidence: "no office yet",
    });
    expect(result.blrHub).toBeUndefined();
    expect(result.techStack).toEqual(["TypeScript"]);
    expect(result.equityText).toBeUndefined();
    expect(result.preOfficeEvidence).toBeUndefined();
  });

  it("falls back to safe defaults for values outside the allowed sets", () => {
    expect(cleanClassification(job, { roleFamily: "wizardry", seniority: "guru", isFoundingRole: "yes", techStack: "TypeScript" })).toEqual({
      roleFamily: "other",
      isFoundingRole: false,
      techStack: [],
    });
    expect(cleanClassification(job, null)).toEqual({ roleFamily: "other", isFoundingRole: false, techStack: [] });
  });
});
