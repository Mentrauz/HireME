// The one place that talks to the LLM. Returns JSON matching `schema`
// (a JSON Schema); Gemini enforces the shape, callers still check the values.
const MODEL = "gemini-3.5-flash-lite";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/** The key's quota is used up; stop the run and pick up tomorrow. */
export class QuotaError extends Error {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The free tier allows 15 requests a minute; one every 4.5 s stays under it.
const MIN_INTERVAL_MS = 4500;
let lastCall = 0;

export async function extract(prompt: string, schema: object): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  for (let attempt = 0; ; attempt++) {
    await sleep(Math.max(0, lastCall + MIN_INTERVAL_MS - Date.now()));
    lastCall = Date.now();
    const res = await fetch(URL, {
      method: "POST",
      headers: { "x-goog-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema, temperature: 0 },
      }),
      signal: AbortSignal.timeout(60_000),
    });
    const body = await res.json();
    if (res.ok) {
      const text = body.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text;
      if (!text) throw new Error(`gemini: no text in response (${body.candidates?.[0]?.finishReason ?? "no candidate"})`);
      return JSON.parse(text);
    }
    const message: string = body.error?.message ?? `HTTP ${res.status}`;
    // A 429 that survives three one-minute waits is the daily quota, not the per-minute limit.
    if (res.status === 429 && attempt >= 3) throw new QuotaError(message);
    if ((res.status !== 429 && res.status < 500) || attempt >= 3) throw new Error(`gemini: ${message}`);
    await sleep(res.status === 429 ? 60_000 : 2000 * 2 ** attempt);
  }
}
