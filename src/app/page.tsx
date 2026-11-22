import Link from "next/link";
import { connection } from "next/server";
import { cache, Suspense, type ReactNode } from "react";
import { CompanyCard } from "@/components/CompanyCard";
import { GlyphField } from "@/components/GlyphField";
import { ArrowRightIcon, BoardsIcon, ExternalIcon, FiltersIcon, ReadIcon } from "@/components/icons";
import { LiveLine, LiveLineSkeleton } from "@/components/LiveLine";
import { parseFilters, searchHref, type SearchFilters } from "@/lib/filters";
import { ROLE_FAMILY_LABELS, SENIORITY_LABELS, WORK_MODE_LABELS } from "@/lib/labels";
import { searchCompanies, siteStats } from "@/lib/queries";

const DEFAULTS = parseFilters({});

// One read of the index per request, shared by every live section below.
const loadIndex = cache(async () => {
  await connection();
  const [stats, search] = await Promise.all([siteStats(), searchCompanies(DEFAULTS)]);
  return { stats, search };
});

const HEADLINE = ["Bengaluru", "startups", "that", "are", "actually", "hiring."];

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-ground transition-[background-color,gap] duration-200 hover:gap-3 hover:bg-white";
const secondaryButton =
  "inline-flex items-center rounded-lg border border-line-strong bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-raised";
const sectionHeading = "text-3xl font-medium tracking-[-0.03em] text-balance sm:text-[2.5rem] sm:leading-[1.08]";
const sectionBody = "mx-auto mt-4 max-w-xl text-base leading-relaxed text-pretty text-muted";

export default function Landing() {
  return (
    <main>
      <section className="relative isolate overflow-hidden">
        <GlyphField className="-z-10" />
        <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center px-4 pt-24 pb-28 text-center sm:px-6 sm:pt-32 sm:pb-36">
          <h1 className="max-w-3xl text-[2.5rem] leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-6xl">
            {HEADLINE.map((word, i) => (
              <span key={word} className="inline-block animate-word-in" style={{ animationDelay: `${i * 80}ms` }}>
                {word}
                {i < HEADLINE.length - 1 && " "}
              </span>
            ))}
          </h1>
          <p className={sectionBody}>
            HireME reads startup job boards every night and lists only the companies that posted a new role in the last 30 days.
            Every role links to its original posting.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/companies" className={primaryButton}>
              Browse companies
              <ArrowRightIcon />
            </Link>
            <Link href="#how" className={secondaryButton}>
              How it works
            </Link>
          </div>
          <Suspense fallback={<LiveLineSkeleton className="mt-10" />}>
            <HeroStats />
          </Suspense>
        </div>
      </section>

      <section aria-labelledby="preview-heading" className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <div className="beam sm:rounded-3xl sm:border sm:border-line sm:bg-surface/60 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pb-4 sm:px-1 sm:pt-1">
            <h2 id="preview-heading" className="text-lg font-medium tracking-tight">
              Companies with the newest roles
            </h2>
            <p className="text-sm text-muted">Live from the index, not a mock-up</p>
          </div>
          <Suspense fallback={<CardsSkeleton />}>
            <Preview />
          </Suspense>
        </div>
      </section>

      <section aria-labelledby="filters-heading" className="pt-28 text-center sm:pt-36">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
          <h2 id="filters-heading" className={`mx-auto max-w-2xl ${sectionHeading}`}>
            Filter by the work you actually do
          </h2>
          <p className={sectionBody}>
            Each posting is sorted by role family, level, work mode and stack. The numbers are live Bengaluru roles; pick one to
            open that search.
          </p>
        </div>
        <Suspense fallback={<div className="mt-10 h-24" />}>
          <FilterChips />
        </Suspense>
      </section>

      <section
        id="how"
        aria-labelledby="how-heading"
        className="mx-auto grid w-full max-w-[1240px] gap-x-16 gap-y-10 px-4 pt-28 sm:px-6 sm:pt-36 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
      >
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="how-heading" className={sectionHeading}>
            From a job board to your shortlist
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-pretty text-muted">
            Role details are never typed in by hand or guessed. Here is where each one comes from.
          </p>
        </div>
        <dl>
          <Step icon={<BoardsIcon />} title="Collect">
            Every night HireME reads the public job boards of the startups it tracks: Greenhouse, Ashby, Lever and Keka. A role
            that leaves the board is closed here the same night.
          </Step>
          <Step icon={<ReadIcon />} title="Read">
            Each posting is read once for work mode, level, role family and stack. Every label has to quote the posting. A blank
            means the posting doesn&apos;t say.
          </Step>
          <Step icon={<FiltersIcon />} title="Filter">
            Narrow the list to what fits you. Each filter shows how many roles it matches before you apply it, so you never land
            on an empty page by surprise.
          </Step>
          <Step icon={<ExternalIcon />} title="Go to the source">
            Every role links straight to its original posting, and every company to its board. You apply there, not through
            HireME.
          </Step>
        </dl>
      </section>

      <section aria-labelledby="next-heading" className="mx-auto w-full max-w-[1240px] px-4 pt-28 sm:px-6 sm:pt-36">
        <h2 id="next-heading" className="text-2xl font-medium tracking-[-0.02em]">
          Not built yet
        </h2>
        <p className="mt-2 max-w-xl text-muted">These are planned. Until they ship, nothing on the site pretends to have them.</p>
        <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
          <Planned title="Funding rounds">Last round, amount and date for each company, each with a link to where it was reported.</Planned>
          <Planned title="Founder contacts">
            Only what a founder has published themselves, behind login, with a daily limit and one-click removal.
          </Planned>
          <Planned title="Founder pages">A free page where a founder can list roles and correct what their card says.</Planned>
        </dl>
      </section>

      <section aria-labelledby="cta-heading" className="mx-auto w-full max-w-[1240px] px-4 py-28 sm:px-6 sm:py-36">
        <div className="relative isolate flex flex-col items-center overflow-hidden rounded-3xl border border-line bg-surface px-6 py-20 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:py-24">
          <GlyphField className="-z-10" />
          <h2 id="cta-heading" className={`max-w-xl ${sectionHeading}`}>
            See who posted a role this week
          </h2>
          <p className={sectionBody}>Free to search. No account needed.</p>
          <Link href="/companies" className={`mt-8 ${primaryButton}`}>
            Browse companies
            <ArrowRightIcon />
          </Link>
        </div>
      </section>
    </main>
  );
}

async function HeroStats() {
  const { stats } = await loadIndex();
  return <LiveLine stats={stats} className="mt-10 justify-center" />;
}

async function Preview() {
  const { search } = await loadIndex();
  const shown = search.companies.slice(0, 3);
  if (!shown.length) {
    return <p className="px-2 py-10 text-center text-sm text-muted">No company has posted a new role in the last 30 days.</p>;
  }
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((c, i) => (
          <div key={c.id} className={`grid ${i === 2 ? "md:hidden lg:grid" : ""}`}>
            <CompanyCard company={c} countLabel="In Bengaluru" />
          </div>
        ))}
      </div>
      <p className="pt-4 pb-1 text-sm sm:px-1">
        <Link href="/companies" className="inline-flex items-center gap-1.5 rounded font-medium text-ink-2 hover:text-ink">
          See all {search.companies.length} companies
          <ArrowRightIcon />
        </Link>
      </p>
    </>
  );
}

interface Chip {
  label: string;
  count: number;
  href: string;
}

async function FilterChips() {
  const { facets } = (await loadIndex()).search;
  const link = (change: Partial<SearchFilters>) => searchHref(DEFAULTS, change);
  const from = <K extends string>(counts: Record<string, number>, labels: Record<K, string>, key: "roleFamily" | "seniority" | "workMode") =>
    (Object.keys(labels) as K[]).map((v): Chip => ({ label: labels[v], count: counts[v] ?? 0, href: link({ [key]: [v] } as Partial<SearchFilters>) }));

  const rows: Chip[][] = [
    [...from(facets.roleFamily, ROLE_FAMILY_LABELS, "roleFamily"), ...from(facets.seniority, SENIORITY_LABELS, "seniority")],
    [...facets.stack.map((s): Chip => ({ label: s.value, count: s.count, href: link({ stack: [s.value] }) })), ...from(facets.workMode, WORK_MODE_LABELS, "workMode")],
  ].map((row) => row.filter((c) => c.count > 0 && c.label !== "Other"));

  return (
    <div className="mt-10 space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="marquee" data-reverse={i % 2 ? "" : undefined}>
          <ul>
            {[false, true].flatMap((copy) =>
              row.map((c) => (
                <li key={`${copy}-${c.href}`} data-copy={copy ? "" : undefined} aria-hidden={copy || undefined} className="pr-3">
                  <Link
                    href={c.href}
                    tabIndex={copy ? -1 : undefined}
                    className="flex items-center gap-2.5 rounded-full border border-line bg-surface py-2 pr-2 pl-4 text-sm whitespace-nowrap text-ink-2 transition-colors hover:border-line-strong hover:bg-raised hover:text-ink"
                  >
                    {c.label}
                    <span className="rounded-full bg-chip px-2 py-0.5 font-mono text-xs text-muted tabular-nums">{c.count}</span>
                  </Link>
                </li>
              )),
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Step({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 border-t border-dashed border-line-strong py-7">
      <span className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-ink-2">{icon}</span>
      <div>
        <dt className="text-lg leading-9 font-medium tracking-tight">{title}</dt>
        <dd className="mt-1 leading-relaxed text-muted">{children}</dd>
      </div>
    </div>
  );
}

function Planned({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-8 gap-y-1 px-5 py-4 sm:grid-cols-[200px_minmax(0,1fr)_auto] sm:items-baseline">
      <dt className="font-medium">{title}</dt>
      <dd className="text-sm leading-relaxed text-muted">{children}</dd>
      <dd className="justify-self-start rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-ink-2">Planned</dd>
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading companies" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className={`h-72 rounded-2xl border border-line bg-surface ${i === 2 ? "md:hidden lg:block" : ""}`} />
      ))}
    </div>
  );
}
