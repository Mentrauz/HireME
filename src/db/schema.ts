// Document shapes for every collection (PLAN.md §3.3). MongoDB does not
// enforce these; TypeScript does, and `ensureIndexes` adds the uniqueness
// rules that matter.
import type { ObjectId } from "mongodb";

export const STAGES = ["stealth", "pre_seed", "seed", "series_a", "series_b_plus"] as const;
export const ROUND_TYPES = ["grant", "pre_seed", "seed", "series_a", "series_b_plus", "unknown"] as const;
export const OFFICE_STATUSES = ["no_office", "apartment", "coworking", "leased_office", "unknown"] as const;
export const ATS_PROVIDERS = ["greenhouse", "ashby", "lever", "keka", "careers_page"] as const;
export const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
export const BLR_HUBS = [
  "HSR Layout",
  "Indiranagar",
  "Koramangala",
  "Bellandur / ORR",
  "Whitefield",
  "CBD / MG Road",
  "Other",
] as const;
export const EMAIL_STATUSES = ["published", "claimed", "opted_out"] as const;
export const EMAIL_SOURCES = ["company_site", "founder_post", "founder_claim"] as const;

export type Stage = (typeof STAGES)[number];
export type RoundType = (typeof ROUND_TYPES)[number];
export type OfficeStatus = (typeof OFFICE_STATUSES)[number];
export type AtsProvider = (typeof ATS_PROVIDERS)[number];
export type WorkMode = (typeof WORK_MODES)[number];
export type BlrHub = (typeof BLR_HUBS)[number];

export interface Company {
  _id: ObjectId;
  name: string;
  /** Lower-case registrable domain; the dedupe key across every source. */
  domain: string;
  cin?: string;
  dpiitId?: string;
  oneLiner?: string;
  foundedOn?: Date;
  stage?: Stage;
  headcountEst?: number;
  headcountSource?: string;
  workMode?: WorkMode;
  blrHub?: BlrHub;
  officeStatus: OfficeStatus;
  atsProvider?: AtsProvider;
  atsSlug?: string;
  careersUrl?: string;
  /** Hash of the careers page text at the last poll. */
  careersHash?: string;
  cohort?: string;
  seedSourceUrl?: string;
  preOfficeScore?: number;
  preOfficeSignals?: string[];
  momentumScore?: number;
  lastHiringSignalAt?: Date;
  claimedByFounder: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  _id: ObjectId;
  companyId: ObjectId;
  source: AtsProvider;
  externalId: string;
  title: string;
  department: string | null;
  location: string | null;
  workMode: WorkMode | null;
  description: string | null;
  /** One classifier call per distinct hash (PLAN.md §3.4). */
  descriptionHash: string | null;
  applyUrl: string | null;
  sourceUrl: string;
  postedOn: Date | null;
  firstSeenOn: Date;
  lastSeenOn: Date;
  isActive: boolean;
  isGhostFlag: boolean;
  // Filled by the classifier, not by the board pullers.
  /** The descriptionHash the fields below were extracted from. */
  classifiedHash?: string;
  roleFamily?: string;
  seniority?: string;
  /** Present only when the classifier, not the board, supplied workMode. */
  workModeEvidence?: string;
  officeDaysPerWeek?: number;
  preOfficeEvidence?: string;
  blrHub?: BlrHub;
  isFoundingRole?: boolean;
  ctcMinLpa?: number;
  ctcMaxLpa?: number;
  equityText?: string;
  techStack?: string[];
}

export interface FundingRound {
  _id: ObjectId;
  companyId: ObjectId;
  roundType: RoundType;
  amountUsd?: number;
  announcedOn?: Date;
  investors: string[];
  leadInvestor?: string;
  sourceType: string;
  sourceUrl: string;
  seenAt: Date;
}

export interface Person {
  _id: ObjectId;
  companyId: ObjectId;
  name: string;
  role?: string;
  linkedinUrl?: string;
  xHandle?: string;
  githubHandle?: string;
  workEmail?: string;
  emailStatus?: (typeof EMAIL_STATUSES)[number];
  emailSource?: (typeof EMAIL_SOURCES)[number];
  sourceUrl?: string;
  seenAt: Date;
}

/** Hiring events and score evidence that are not job documents. */
export interface Signal {
  _id: ObjectId;
  companyId: ObjectId;
  kind: string;
  observedOn: Date;
  sourceUrl: string;
  payload?: Record<string, unknown>;
}

export interface Submission {
  _id: ObjectId;
  companyId?: ObjectId;
  submittedBy?: string;
  kind: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  reviewedAt?: Date;
}

export interface ContactView {
  _id: ObjectId;
  userId: string;
  personId: ObjectId;
  viewedAt: Date;
}

export interface Suppression {
  _id: ObjectId;
  emailOrDomain: string;
  personId?: ObjectId;
  requestedAt: Date;
  honouredAt?: Date;
}

export interface SourceRun {
  _id: ObjectId;
  source: string;
  startedAt: Date;
  finishedAt?: Date;
  recordsSeen: number;
  errors: { target: string; message: string }[];
}
