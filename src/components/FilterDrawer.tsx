"use client";

import { useState, type ReactNode } from "react";
import { FiltersIcon } from "./icons";

/** On small screens the filter column folds behind a button; from md up it is always shown. */
export function FilterDrawer({ activeCount, children }: { activeCount: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="filters"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium md:hidden"
      >
        <span className="flex items-center gap-2">
          <FiltersIcon />
          {open ? "Hide filters" : "Filters"}
        </span>
        {activeCount > 0 && (
          <span className="rounded-full bg-live-soft px-2 text-xs leading-5 font-medium text-live tabular-nums">{activeCount} on</span>
        )}
      </button>
      <div id="filters" className={`${open ? "block" : "hidden"} mt-3 md:mt-0 md:block`}>
        {children}
      </div>
    </div>
  );
}
