import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="bg-ink text-white">
      <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center gap-8 px-4 sm:px-6">
        <Link href="/" className="text-[17px] font-semibold tracking-tight">
          HireME
        </Link>
        <nav aria-label="Main" className="flex h-full items-stretch text-sm">
          <Link
            href="/"
            aria-current="page"
            className="relative flex items-center text-white before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-white"
          >
            Companies
          </Link>
        </nav>
        <p className="ml-auto hidden text-xs text-zinc-400 sm:block">Bengaluru · refreshed nightly</p>
      </div>
    </header>
  );
}
