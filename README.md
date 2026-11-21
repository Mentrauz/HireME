# Bengaluru Startup Hiring Radar

Which Bengaluru startups are hiring right now. The plan is in [PLAN.md](PLAN.md); the research behind it is in [RESEARCH.md](RESEARCH.md).

Next.js (App Router), TypeScript and MongoDB. The web app and the daily workers share `src/db` and `src/lib`.

## Run it locally

```sh
npm install
npm run db:local      # terminal 1: a local mongod, data in ./.data/mongo
npm run seed          # terminal 2: load seed/companies.json
npm run poll:ats      # pull every company's job board
npm run poll:careers  # check careers pages for companies with no board
npm run classify      # extract work mode, role family, stack and pay with Gemini (needs GEMINI_API_KEY)
npm run report        # progress against the Phase 1 gate
npm run dev           # the site, at http://localhost:3000
```

To use another database, copy `.env.example` to `.env` and set `MONGODB_URI`.

## Adding companies

Each entry in `seed/companies.json` needs a `name`, a `domain`, and either an `atsProvider` with its `atsSlug`, or `"atsProvider": "careers_page"` with a `careersUrl`.

To find which board a company uses, try likely slugs:

```sh
npm run probe -- sarvam composio
```

It prints one line per board that answers, with how many postings are in India and in Bengaluru. A slug with no Indian postings usually belongs to a different company of the same name.

## Layout

| Path | What |
|---|---|
| `src/app` | The Next.js site |
| `src/db` | Collection types, connection, indexes |
| `src/ats` | One adapter per job board, each turning a raw response into the same job shape |
| `src/lib` | HTTP rules, raw-response store, job reconciliation, read queries |
| `src/workers` | The daily jobs, run with `npm run …` |
| `seed` | The hand-built company list |
| `tests` | `npm test` |

## Nightly run

`.github/workflows/nightly.yml` runs the pollers and the classifier every day at 02:00 IST. It needs three repository secrets (Settings → Secrets and variables → Actions): `MONGODB_URI`, `GEMINI_API_KEY` and `CONTACT_EMAIL`. Atlas must also accept connections from GitHub's runners, whose addresses change, so its network access list has to allow `0.0.0.0/0`.

## Checks

```sh
npm run typecheck && npm run lint && npm test && npm run build
```
