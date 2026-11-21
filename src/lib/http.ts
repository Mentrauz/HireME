// Every outbound request goes through here so the User-Agent, timeout and
// pacing rules in PLAN.md §6 apply everywhere.
const contact = process.env.CONTACT_EMAIL?.trim();
export const USER_AGENT = `HireMEBot/0.1 (Bengaluru startup hiring index${contact ? `; contact ${contact}` : ""})`;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET with a timeout. Retries network failures, 429 and 5xx; never other 4xx. */
export async function fetchText(url: string, { retries = 2, timeoutMs = 20_000 } = {}): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": USER_AGENT, accept: "application/json, text/html;q=0.9" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return await res.text();
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt >= retries) throw new HttpError(res.status, url);
    } catch (err) {
      if (err instanceof HttpError || attempt >= retries) throw err;
    }
    await sleep(1000 * 2 ** attempt);
  }
}

/** Lever sometimes answers a JSON endpoint with an HTML page; say so plainly. */
export async function fetchJson(url: string): Promise<unknown> {
  const body = await fetchText(url);
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`Expected JSON from ${url}, got: ${body.slice(0, 60).replace(/\s+/g, " ")}`);
  }
}

/** Run `fn` over `items` with at most `limit` in flight. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
