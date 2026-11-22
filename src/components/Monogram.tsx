import { initials } from "@/lib/labels";

/** Stands in for a logo: we store none, and fetching sites' icons would leak visits. */
export function Monogram({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-14 rounded-xl text-lg" : "size-10 rounded-lg text-sm";
  return (
    <span
      aria-hidden="true"
      className={`${box} grid shrink-0 place-items-center border border-line bg-chip font-semibold tracking-tight text-ink`}
    >
      {initials(name)}
    </span>
  );
}
