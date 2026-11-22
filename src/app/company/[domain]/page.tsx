import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BackIcon, ExternalIcon } from "@/components/icons";
import { Monogram } from "@/components/Monogram";
import {
  boardUrl,
  formatDay,
  roleFamilyLabel,
  seniorityLabel,
  SOURCE_LABELS,
  STAGE_LABELS,
  WORK_MODE_LABELS,
  sinceDay,
} from "@/lib/labels";
import { companyProfile, type RoleSummary } from "@/lib/queries";

type Params = Promise<{ domain: string }>;

export default function CompanyPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto w-full max-w-[960px] px-4 pt-6 pb-16 sm:px-6">
      <Link href="/companies" className="inline-flex items-center gap-1.5 rounded text-sm text-muted hover:text-ink">
        <BackIcon />
        All companies
      </Link>
      <Suspense fallback={<div aria-busy="true" aria-label="Loading company" className="mt-4 h-48 rounded-xl border border-line bg-surface" />}>
        <Profile params={params} />
      </Suspense>
    </main>
  );
}

function Fact({ label, value, muted = false, note }: { label: string; value: string; muted?: boolean; note?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-0.5 text-sm ${muted ? "text-muted" : "font-medium"}`}>{value}</dd>
      {note && <dd className="mt-0.5 text-xs text-muted">{note}</dd>}
    </div>
  );
}

async function Profile({ params }: { params: Params }) {
  await connection();
  const { domain } = await params;
  const data = await companyProfile(decodeURIComponent(domain));
  if (!data) notFound();
  const { company: c, roles, bengaluruRoles } = data;
  const board = boardUrl(c);

  return (
    <>
      <section className="mt-4 rounded-2xl border border-line bg-surface p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="flex flex-wrap items-start gap-4">
          <Monogram name={c.name} size="lg" />
          <div className="min-w-[10rem] flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
            <a
              href={`https://${c.domain}`}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 rounded text-sm text-muted underline-offset-2 hover:text-ink hover:underline"
            >
              {c.domain}
              <ExternalIcon className="size-3" />
            </a>
          </div>
          {board && c.atsProvider && (
            <a
              href={board}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-raised"
            >
              {SOURCE_LABELS[c.atsProvider]} board
              <ExternalIcon className="size-3.5" />
            </a>
          )}
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-4">
          {/* Stage comes from the hand-built seed list until funding rounds are sourced. */}
          <Fact
            label="Stage"
            value={c.stage ? STAGE_LABELS[c.stage] : "Not known"}
            muted={!c.stage}
            note={c.stage ? "From our seed list, not yet sourced" : undefined}
          />
          <Fact label="Cohort" value={c.cohort ?? "None recorded"} muted={!c.cohort} />
          <Fact
            label="Last new role"
            value={c.lastHiringSignalAt ? formatDay(c.lastHiringSignalAt) : "None in our records"}
            muted={!c.lastHiringSignalAt}
          />
          <Fact label="Live roles" value={`${roles.length} (${bengaluruRoles} in Bengaluru)`} />
        </dl>
      </section>

      <section aria-labelledby="roles-heading" className="mt-8">
        <h2 id="roles-heading" className="text-lg font-semibold">
          Live roles <span className="font-normal text-muted tabular-nums">{roles.length}</span>
        </h2>
        {roles.length > 0 ? (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {roles.map((r) => (
              <RoleRow key={r.id} role={r} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-sm text-muted">
            The board lists no open roles right now. We check it again every night.
          </p>
        )}
        {c.atsProvider && (
          <p className="mt-4 text-xs text-muted">
            Roles are read nightly from {c.name}&apos;s {SOURCE_LABELS[c.atsProvider]} board. Work mode, level, role family and stack
            are read from each posting&apos;s own text; a blank means the posting doesn&apos;t say.
          </p>
        )}
      </section>
    </>
  );
}

function RoleRow({ role: r }: { role: RoleSummary }) {
  const when = r.postedOn ? `Posted ${sinceDay(r.postedOn)}` : `First seen ${sinceDay(r.firstSeenOn)}`;
  const meta = [r.department, r.location, when].filter(Boolean).join(" · ");
  const tags = [
    r.workMode && WORK_MODE_LABELS[r.workMode],
    r.seniority && seniorityLabel(r.seniority),
    r.roleFamily && r.roleFamily !== "other" && roleFamilyLabel(r.roleFamily),
    ...(r.techStack ?? []).slice(0, 4),
  ].filter((t): t is string => Boolean(t));

  return (
    <li className="relative grid gap-3 px-5 py-4 transition-colors hover:bg-raised">
      <div className="min-w-0">
        <a
          href={r.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ink"
        >
          {r.title}
          <ExternalIcon className="size-3.5 shrink-0 text-muted" />
        </a>
        <p className="mt-0.5 truncate text-xs text-muted">{meta}</p>
      </div>
      {(tags.length > 0 || r.isFoundingRole) && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Details">
          {r.isFoundingRole && <li className="rounded-md bg-live-soft px-2 py-1 text-xs font-medium text-live">Founding role</li>}
          {tags.map((t) => (
            <li key={t} className="rounded-md bg-chip px-2 py-1 text-xs text-ink-2">
              {t}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
