# CLAUDE.md

Only Use Haiku and Sonnet Agents depending on the work requirements.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

**Rule:** Always refer to this file before processing any request. Update whats new if frontend or workflow related changes are done.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## What's new

Newest first. Add an entry when the frontend or the workflow changes.

- **2026-11-22** — Frontend: Lenis smooth scrolling on every page (`src/components/SmoothScroll.tsx`, mounted in `layout.tsx`; off under reduced motion; in-page links offset by the header). The page scrollbar is hidden until the mouse reaches the right edge.

- **2026-11-22** — Frontend, dark redesign:
  - The site is dark only (tokens in `src/app/globals.css`).
  - `/` is a new landing page built on live index data.
  - The search moved from `/` to `/companies` and has a hero band.
  - `GlyphField` is the animated dot backdrop; the header and footer are in `SiteHeader.tsx`.

- **2026-11-22** — Frontend:
  - `/` is now a company search. The search bar holds keyword, location (Bengaluru or any) and hiring window. The left column filters by work mode, level, role family, stack and founding roles, each option with a live role count. Results are company cards listing their matching roles.
  - New `/company/[domain]` page lists every live role, each linked to its posting.
  - Filters live in the URL (`src/lib/filters.ts`).
  - Product context is in `PRODUCT.md`, and the visual system in `DESIGN.md`.
- **2026-11-22** — Workflow: Keka is a fourth job board. A Keka `atsSlug` is `<subdomain>/<board id>`; the board id is the GUID on `https://<subdomain>.keka.com/careers/`. Frontend: cards can show "Keka board" as the source.
- **2026-11-22** — Workflow: `npm run classify` (Gemini fills role family, seniority, work mode, hub, pay, equity and stack on each job; every claim must quote the posting). Nightly GitHub Actions run (`.github/workflows/nightly.yml`) and CI (`ci.yml`). The Gemini key is read from `GEMINI_API_KEY`.
- **2026-11-21** — Stack set to Next.js (App Router), TypeScript and MongoDB. Workflow: `npm run db:local`, `seed`, `poll:ats`, `poll:careers`, `report`, `probe`. Frontend: home page lists companies with a hiring signal in the last 30 days.
