import { Suspense } from "react";
import { connection } from "next/server";
import { HIRING_WINDOW_DAYS, hiringCompanies } from "@/lib/queries";

const STAGE_LABELS: Record<string, string> = {
  stealth: "Stealth",
  pre_seed: "Pre-seed",
  seed: "Seed",
  series_a: "Series A",
  series_b_plus: "Series B+",
};

const SOURCE_LABELS: Record<string, string> = {
  greenhouse: "Greenhouse board",
  ashby: "Ashby board",
  lever: "Lever board",
  careers_page: "Careers page",
};

const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

async function HiringTable() {
  // The index changes daily, so read it per request rather than at build time.
  await connection();
  const companies = await hiringCompanies();

  if (!companies.length) {
    return <p className="text-zinc-600">No company has a hiring signal in the last {HIRING_WINDOW_DAYS} days yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-300 text-zinc-600">
          <tr>
            <th className="py-2 pr-4 font-medium">Company</th>
            <th className="py-2 pr-4 font-medium">Stage</th>
            <th className="py-2 pr-4 font-medium">Last hiring signal</th>
            <th className="py-2 pr-4 text-right font-medium">Open roles</th>
            <th className="py-2 pr-4 text-right font-medium">In Bengaluru</th>
            <th className="py-2 font-medium">Source</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((co) => (
            <tr key={co.id} className="border-b border-zinc-200">
              <td className="py-2 pr-4">
                <a className="font-medium underline-offset-2 hover:underline" href={`https://${co.domain}`} rel="noreferrer">
                  {co.name}
                </a>
              </td>
              <td className="py-2 pr-4">{co.stage ? STAGE_LABELS[co.stage] : "—"}</td>
              <td className="py-2 pr-4 tabular-nums">{day.format(co.lastHiringSignalAt)}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{co.liveJobs}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{co.bengaluruJobs}</td>
              <td className="py-2 text-zinc-600">{co.atsProvider ? SOURCE_LABELS[co.atsProvider] : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Bengaluru startups hiring now</h1>
      <p className="mt-1 mb-6 text-zinc-600">
        Companies that published a new role in the last {HIRING_WINDOW_DAYS} days, newest first.
      </p>
      <Suspense fallback={<p className="text-zinc-600">Loading…</p>}>
        <HiringTable />
      </Suspense>
    </main>
  );
}
