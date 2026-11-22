import Link from "next/link";
import { Suspense } from "react";
import { CompanyCard } from "@/components/CompanyCard";
import { FilterDrawer } from "@/components/FilterDrawer";
import { activeChips, FilterPanel, SearchBar } from "@/components/SearchControls";
import { parseFilters, searchHref, usesClassifierFields, type SearchParams } from "@/lib/filters";
import { searchCompanies } from "@/lib/queries";

export default function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-16 sm:px-6">
      <Suspense fallback={<SearchSkeleton />}>
        <Search searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Search({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const f = parseFilters(await searchParams);
  const r = await searchCompanies(f);
  const n = r.companies.length;
  const sortLink = (sort: "recent" | "roles", label: string) => (
    <Link
      href={searchHref(f, { sort })}
      aria-current={f.sort === sort ? "true" : undefined}
      className={f.sort === sort ? "font-semibold text-ink" : "text-muted underline-offset-2 hover:text-ink hover:underline"}
    >
      {label}
    </Link>
  );

  return (
    <form action="/" method="get">
      {f.sort !== "recent" && <input type="hidden" name="sort" value={f.sort} />}
      <SearchBar filters={f} />

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside aria-label="Filters">
          <FilterDrawer activeCount={activeChips(f).length}>
            <FilterPanel filters={f} facets={r.facets} />
          </FilterDrawer>
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h1 id="results-heading" className="text-2xl tracking-tight">
              <span className="font-semibold tabular-nums">{n}</span> {n === 1 ? "company" : "companies"}{" "}
              {f.window === "30d" ? "hiring now" : "with live roles"}
            </h1>
            <p className="flex gap-3 text-sm">
              <span className="text-muted">Sort by</span>
              {sortLink("recent", "Newest role")}
              {sortLink("roles", "Most roles")}
            </p>
          </div>
          <p className="mt-1 text-sm text-muted">
            {r.matchingRoles} matching {r.matchingRoles === 1 ? "role" : "roles"}
            {f.location === "bengaluru" ? " in Bengaluru" : ""}
            {f.window === "30d" ? ", from companies that posted a new role in the last 30 days." : "."}
          </p>
          {usesClassifierFields(f) && r.unreadRoles > 0 && (
            <p className="mt-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink-2">
              {r.unreadRoles} {r.unreadRoles === 1 ? "role hasn't" : "roles haven't"} been read yet, so these filters skip{" "}
              {r.unreadRoles === 1 ? "it" : "them"}. New roles are read every night.
            </p>
          )}

          {n > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {r.companies.map((c) => (
                <CompanyCard key={c.id} company={c} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
              <p className="font-semibold">No company matches all of these filters</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                {f.location === "bengaluru"
                  ? "Remove a filter from the search bar, or set the location to Any location to include roles outside Bengaluru."
                  : "Remove a filter from the search bar, or set the hiring signal to Any time."}
              </p>
              <Link href="/" className="mt-5 inline-block rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-2">
                Clear all filters
              </Link>
            </div>
          )}
        </section>
      </div>
    </form>
  );
}

function SearchSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading companies">
      <div className="h-14 rounded-xl border border-line bg-surface" />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <div className="hidden space-y-3 md:block">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-4 rounded bg-line motion-safe:animate-pulse" />
          ))}
        </div>
        <div>
          <div className="h-8 w-64 rounded bg-line motion-safe:animate-pulse" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-64 rounded-xl border border-line bg-surface" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
