"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Only the landing page needs a way into the app from the header. */
export function HeaderCta() {
  if (usePathname() !== "/") return null;
  return (
    <Link
      href="/companies"
      className="ml-auto rounded-lg border border-line-strong px-3.5 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-raised hover:text-ink"
    >
      Browse companies
    </Link>
  );
}
