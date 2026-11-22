# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: Bengaluru job seekers.** Engineers, designers, product managers, and early ops or go-to-market hires who want to skip ghost postings and reach startups that are actually hiring. They use it on phone and laptop about equally: browsing and shortlisting on the phone, comparing companies and writing outreach on the laptop. The builder is the first user.
- **Secondary: early-stage founders.** Teams that cannot justify LinkedIn Recruiter or Instahyre. They list roles free, claim their company's card, correct it, and control what it shows about them.

## Product Purpose

HireME answers one question for a job seeker: which Bengaluru startups are hiring right now, how well funded are they, where do they work from, and who do I contact? Success is a seeker finding a live opening at a funded startup and reaching its founder, and a founder getting relevant candidates without paying for a recruiting tool.

## Positioning

Company-first, not a job board. Jobs, funding rounds, founders and office signals all hang off a company record that is refreshed daily, and every claim carries a dated source link. No product in India reliably links raised recently → hiring now → founder contact for Bengaluru; the nearest tools that do are investor products costing around $750 per user per month. Signals unique to HireME: Bengaluru hub (HSR Layout, Indiranagar, Koramangala, Bellandur / ORR, Whitefield, CBD / MG Road), founding roles with stated pay, and pre-office or flat-stage teams.

## Operating Context

- Seekers filter and scan companies, open a company to see live roles and evidence, then contact the founder from their own mailbox using a copied draft.
- The index refreshes nightly from public job boards (Greenhouse, Ashby, Lever, Keka), careers-page changes, and founder submissions. A company counts as hiring when it has a hiring signal in the last 30 days; each card shows its "last active signal" line.
- Founders arrive through a submit form or a `/claim` link sent by hand.

## Capabilities and Constraints

- Stack: Next.js (App Router), TypeScript, MongoDB. Free tiers only; solo builder with no budget.
- Live today: a list of companies with a hiring signal in the last 30 days. Jobs carry classifier fields (role family, seniority, work mode, hub, founding role, CTC range in LPA, equity text, tech stack), each backed by a quoted sentence from the posting.
- Planned for the private beta (PLAN.md Phase 2): search with filters, company profile with founder cards, Google login, submit form, `/claim` with one-click opt-out, a "copy draft" cold-email template, and a privacy policy.
- Rules every screen must respect:
  - Every fact shown carries its source link and the date it was seen.
  - Founder contacts show only what the founder or company published, or entered through `/claim`. Viewing one requires login and is capped at 10 a day.
  - Opt-out is one click and honoured within 72 hours.
  - The platform never sends email and never exports person or contact data in bulk.
  - "Unknown" is a valid value and is shown honestly, never filled in with a guess.
- Money: INR, CTC in LPA (lakhs per annum); funding amounts in USD as reported.
- Open: Second city (later); paid tiers (later, never at the cost of free seeker access).

## Brand Commitments

- Name: **HireME**. The page title and PLAN.md still say "Bengaluru Startup Hiring Radar"; HireME replaces it.
- Voice: plain, factual, sourced. No hype about "AI" or "opportunities".

## Evidence on Hand

- 47 seeded companies, 34 with a hiring signal in the last 30 days, about 1,000 live jobs (`seed/companies.json`, MongoDB `hireme`).
- No funding rounds, founder contacts, pre-office scores, users, testimonials or founder claims exist yet. Future work must not display, imply or mock these as if real.

## Product Principles

1. **Evidence over assertion.** Every badge, score or label links to the source that produced it.
2. **Company first.** The company is the unit; jobs and people are its children.
3. **Consent before reach.** Contact data is published-only, rate-limited and removable in one click.
4. **Fresh or flagged.** Show how old a signal is; expire what is stale rather than hiding its age.
5. **Free for seekers.** Monetisation never gates core search or the daily contact allowance.

## Accessibility & Inclusion

Best effort, with no formal WCAG target yet: readable contrast, full keyboard use and labelled controls as good practice.
