import { formatDay } from "@/lib/labels";
import type { SiteStats } from "@/lib/queries";

const count = new Intl.NumberFormat("en-IN");

function Figure({ n, label }: { n: number; label: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-mono font-medium text-ink tabular-nums">{count.format(n)}</span> {label}
    </span>
  );
}

/** One line of live counts from the index, led by the green "live" dot. */
export function LiveLine({ stats, className = "" }: { stats: SiteStats; className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted ${className}`}>
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-live shadow-[0_0_0_3px_var(--color-live-soft)]" />
        <Figure n={stats.hiringCompanies} label={stats.hiringCompanies === 1 ? "company hiring in Bengaluru" : "companies hiring in Bengaluru"} />
      </span>
      <Figure n={stats.liveRoles} label={stats.liveRoles === 1 ? "live role" : "live roles"} />
      {stats.checkedAt && <span className="whitespace-nowrap">Boards last read {formatDay(stats.checkedAt)}</span>}
    </p>
  );
}

export function LiveLineSkeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`h-5 w-72 max-w-full rounded bg-line motion-safe:animate-pulse ${className}`} />;
}
