import Link from "next/link";
import { boardUrl, seniorityLabel, SOURCE_LABELS, STAGE_LABELS, WORK_MODE_LABELS, sinceDay } from "@/lib/labels";
import type { CompanyResult } from "@/lib/queries";
import { ExternalIcon } from "./icons";
import { Monogram } from "./Monogram";

export function CompanyCard({ company: c }: { company: CompanyResult }) {
  const board = boardUrl(c);
  const more = c.matchingRoles - c.roles.length;

  return (
    <article className="relative flex flex-col rounded-xl border border-line bg-surface p-5 transition-[box-shadow,border-color] duration-200 ease-out hover:border-line-strong hover:shadow-[0_8px_20px_-10px_rgba(12,13,15,0.18)]">
      <header className="flex items-start gap-3">
        <Monogram name={c.name} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] leading-snug font-semibold">
            <Link href={`/company/${c.domain}`} className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ink">
              {c.name}
            </Link>
          </h2>
          <p className="truncate text-xs text-muted">{c.domain}</p>
        </div>
        {c.cohort && <span className="shrink-0 rounded-md bg-chip px-2 py-0.5 text-xs font-medium text-ink-2">{c.cohort}</span>}
      </header>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div>
          <dt className="text-muted">Stage</dt>
          <dd className={`mt-0.5 ${c.stage ? "font-semibold" : "text-muted"}`}>{c.stage ? STAGE_LABELS[c.stage] : "Unknown"}</dd>
        </div>
        <div>
          <dt className="text-muted">Work mode</dt>
          <dd className={`mt-0.5 ${c.workMode ? "font-semibold" : "text-muted"}`}>{c.workMode ? WORK_MODE_LABELS[c.workMode] : "Not stated"}</dd>
        </div>
        <div className="text-right">
          <dt className="text-muted">{c.matchingRoles === c.liveRoles ? "Roles" : "Matching"}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            {c.matchingRoles === c.liveRoles ? c.liveRoles : `${c.matchingRoles} of ${c.liveRoles}`}
          </dd>
        </div>
      </dl>

      <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm" aria-label="Matching roles">
        {c.roles.map((r) => (
          <li key={r.id} className="flex items-baseline justify-between gap-3">
            <span className="line-clamp-2 text-ink-2">{r.title}</span>
            {r.seniority && <span className="shrink-0 text-xs text-muted">{seniorityLabel(r.seniority)}</span>}
          </li>
        ))}
        {more > 0 && <li className="text-xs text-muted">and {more} more</li>}
      </ul>

      {(c.stack.length > 0 || c.hasFoundingRole) && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
          {c.hasFoundingRole && <li className="rounded-md bg-live-soft px-2 py-1 text-xs font-medium text-live">Founding role</li>}
          {c.stack.map((s) => (
            <li key={s} className="rounded-md bg-chip px-2 py-1 text-xs text-ink-2">
              {s}
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs">
        <p className="flex items-center gap-1.5 text-muted">
          <span aria-hidden="true" className={`size-1.5 rounded-full ${c.freshSignal ? "bg-live" : "bg-line-strong"}`} />
          {c.lastHiringSignalAt ? `New role ${sinceDay(c.lastHiringSignalAt)}` : "No recent signal"}
        </p>
        {board && c.atsProvider && (
          <a
            href={board}
            target="_blank"
            rel="noreferrer"
            className="relative z-10 flex items-center gap-1 rounded text-ink-2 underline-offset-2 hover:text-ink hover:underline"
          >
            {SOURCE_LABELS[c.atsProvider]}
            <ExternalIcon className="size-3" />
            <span className="sr-only">(opens {c.name}&apos;s job board)</span>
          </a>
        )}
      </footer>
    </article>
  );
}
