const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export const decodeEntities = (s: string): string =>
  s.replace(/&(#?\w+);/g, (m, name: string) => {
    if (name in ENTITIES) return ENTITIES[name]!;
    const code = /^#x/i.test(name) ? parseInt(name.slice(2), 16) : name.startsWith("#") ? Number(name.slice(1)) : NaN;
    return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });

/** HTML to readable plain text: block ends become newlines, tags go, whitespace collapses. */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6]|tr)>|<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\r\f\v ]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const isoDay = (value: unknown): string | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

export const str = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);
