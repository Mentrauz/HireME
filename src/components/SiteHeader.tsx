import Link from "next/link";
import { Suspense } from "react";
import { HeaderCta } from "./HeaderCta";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ground/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center gap-8 px-4 sm:px-6">
        <Link href="/" className="rounded text-[17px] font-semibold tracking-tight">
          HireME
        </Link>
        <nav aria-label="Main" className="flex items-center gap-6 text-sm text-ink-2">
          <Link href="/companies" className="rounded transition-colors hover:text-ink">
            Companies
          </Link>
          <Link href="/#how" className="hidden rounded transition-colors hover:text-ink sm:block">
            How it works
          </Link>
        </nav>
        <Suspense>
          <HeaderCta />
        </Suspense>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-start justify-between gap-x-10 gap-y-4 px-4 py-8 text-sm sm:px-6">
        <div className="max-w-md">
          <p className="font-semibold tracking-tight">HireME</p>
          <p className="mt-1 text-muted">
            Roles are read from public job boards and link to their source. HireME never sends email on your behalf.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-6 text-ink-2">
          <Link href="/companies" className="rounded hover:text-ink">
            Companies
          </Link>
          <Link href="/#how" className="rounded hover:text-ink">
            How it works
          </Link>
        </nav>
      </div>
    </footer>
  );
}
