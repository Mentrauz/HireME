import Link from "next/link";
import type { ReactNode } from "react";
import { WORK_MODES } from "@/db/schema";
import { ROLE_FAMILIES, SENIORITIES } from "@/lib/classifyJob";
import { searchHref, type SearchFilters } from "@/lib/filters";
import { ROLE_FAMILY_LABELS, SENIORITY_LABELS, WORK_MODE_LABELS } from "@/lib/labels";
import type { SearchResult } from "@/lib/queries";
import { ChevronDownIcon, ClockIcon, CloseIcon, PinIcon, SearchIcon } from "./icons";

interface Chip {
  label: string;
  href: string;
}

/** Every active sidebar filter as a chip whose link removes just that filter. */
export function activeChips(f: SearchFilters): Chip[] {
  const without = <K extends "workMode" | "seniority" | "roleFamily" | "stack">(key: K, v: string) =>
    searchHref(f, { [key]: (f[key] as string[]).filter((x) => x !== v) } as Partial<SearchFilters>);
  return [
    ...f.workMode.map((v) => ({ label: WORK_MODE_LABELS[v], href: without("workMode", v) })),
    ...f.seniority.map((v) => ({ label: SENIORITY_LABELS[v], href: without("seniority", v) })),
    ...f.roleFamily.map((v) => ({ label: ROLE_FAMILY_LABELS[v], href: without("roleFamily", v) })),
    ...f.stack.map((v) => ({ label: v, href: without("stack", v) })),
    ...(f.founding ? [{ label: "Founding roles", href: searchHref(f, { founding: false }) }] : []),
  ];
}

function SelectField({ icon, label, name, value, options, className = "" }: {
  icon: ReactNode;
  label: string;
  name: string;
  value: string;
  options: [string, string][];
  className?: string;
}) {
  return (
    <label className={`relative flex min-h-14 items-center gap-2.5 bg-surface px-4 text-sm text-ink focus-within:shadow-[inset_0_0_0_2px_var(--color-ink)] ${className}`}>
      <span className="text-muted">{icon}</span>
      <span className="sr-only">{label}</span>
      <select name={name} defaultValue={value} className="w-full cursor-pointer appearance-none bg-transparent pr-6 font-medium outline-none">
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-4 size-4 text-muted" />
    </label>
  );
}

export function SearchBar({ filters: f }: { filters: SearchFilters }) {
  const chips = activeChips(f);
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-line-strong bg-line shadow-[0_24px_48px_-24px_rgba(0,0,0,0.9)] lg:grid-cols-[minmax(0,1fr)_200px_240px_auto]">
      <div className="flex min-h-14 flex-wrap items-center gap-2 bg-surface px-4 py-2 focus-within:shadow-[inset_0_0_0_2px_var(--color-ink)]">
        <SearchIcon className="size-[18px] shrink-0 text-muted" />
        {chips.map((c) => (
          <Link
            key={c.href + c.label}
            href={c.href}
            className="flex items-center gap-1.5 rounded-md bg-chip py-1 pr-1.5 pl-2 text-xs font-medium text-ink-2 transition-colors hover:bg-line-strong"
          >
            {c.label}
            <CloseIcon className="size-3.5" />
            <span className="sr-only">(remove filter)</span>
          </Link>
        ))}
        <input
          type="search"
          name="q"
          defaultValue={f.q}
          placeholder="Role, company or stack"
          aria-label="Search roles, companies or stack"
          className="min-w-36 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
      </div>
      <SelectField
        icon={<PinIcon />}
        label="Location"
        name="location"
        value={f.location}
        options={[["bengaluru", "Bengaluru roles"], ["anywhere", "Any location"]]}
      />
      <SelectField
        icon={<ClockIcon />}
        label="Hiring signal"
        name="window"
        value={f.window}
        options={[["30d", "New role in last 30 days"], ["any", "Any time"]]}
      />
      <button
        type="submit"
        className="min-h-14 bg-ink px-7 text-sm font-semibold text-ground transition-colors hover:bg-white focus-visible:outline-offset-[-4px] focus-visible:outline-ground"
      >
        Search
      </button>
    </div>
  );
}

function Count({ n, on }: { n: number; on: boolean }) {
  return (
    <span className={`min-w-7 rounded-full px-1.5 text-center text-xs leading-5 tabular-nums ${on ? "bg-live-soft font-medium text-live" : "bg-chip text-muted"}`}>
      {n}
    </span>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group border-b border-line py-4 first:pt-0">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDownIcon className="size-4 text-muted transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <ul className="mt-3 space-y-1">{children}</ul>
    </details>
  );
}

function Option({ name, value, label, count, checked }: { name: string; value: string; label: string; count: number; checked: boolean }) {
  const empty = count === 0 && !checked;
  return (
    <li>
      <label className={`flex items-center gap-3 rounded-md py-1 text-sm ${empty ? "cursor-default text-muted/60" : "cursor-pointer text-ink-2 hover:text-ink"}`}>
        <input type="checkbox" name={name} value={value} defaultChecked={checked} disabled={empty} className="size-4 shrink-0 cursor-[inherit]" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <Count n={count} on={checked} />
      </label>
    </li>
  );
}

export function FilterPanel({ filters: f, facets }: { filters: SearchFilters; facets: SearchResult["facets"] }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 md:border-0 md:bg-transparent md:p-0">
      <Group title="Work mode">
        {WORK_MODES.map((v) => (
          <Option key={v} name="workMode" value={v} label={WORK_MODE_LABELS[v]} count={facets.workMode[v] ?? 0} checked={f.workMode.includes(v)} />
        ))}
      </Group>
      <Group title="Level">
        {SENIORITIES.map((v) => (
          <Option key={v} name="seniority" value={v} label={SENIORITY_LABELS[v]} count={facets.seniority[v] ?? 0} checked={f.seniority.includes(v)} />
        ))}
      </Group>
      <Group title="Role family">
        {ROLE_FAMILIES.map((v) => (
          <Option key={v} name="roleFamily" value={v} label={ROLE_FAMILY_LABELS[v]} count={facets.roleFamily[v] ?? 0} checked={f.roleFamily.includes(v)} />
        ))}
      </Group>
      <Group title="Tech stack">
        {facets.stack.map(({ value, count }) => (
          <Option key={value} name="stack" value={value} label={value} count={count} checked={f.stack.includes(value)} />
        ))}
      </Group>
      <Group title="Founding roles">
        <Option name="founding" value="1" label="Founding roles only" count={facets.founding} checked={f.founding} />
      </Group>
      <div className="flex gap-2 pt-5">
        <button
          type="submit"
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-ground transition-colors hover:bg-white"
        >
          Apply
        </button>
        <Link href="/companies" className="rounded-lg border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-raised hover:text-ink">
          Reset
        </Link>
      </div>
    </div>
  );
}
