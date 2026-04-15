/**
 * TSA security wait-time lookup.
 *
 * The official TSA API was deprecated in 2020. There's no single
 * authoritative public source today, so we layer two strategies:
 *
 *   1. If we know the airport's own public wait-time page (see
 *      `lib/airports.ts`), we surface a deep link to it. That's the
 *      most reliable info — no API quota, official numbers.
 *
 *   2. We expose a stub `estimateWaitMinutes()` that returns a coarse
 *      "expect ~X min" based on time of day. Replace with a real API
 *      (e.g. ifly.com or a paid provider) by editing this one file.
 *
 * Keeping the surface narrow means we can wire in a real source later
 * without touching any UI.
 */

import { lookupAirport } from "./airports";

export type TsaInfo = {
  iata: string;
  name: string;
  /** URL the user can open for live, official numbers. */
  officialUrl?: string;
  /** Coarse model — useful when no API key is configured. */
  estimateMinutes: number;
  estimateLabel: "low" | "medium" | "high";
  source: "official-link" | "estimate";
  notes?: string;
};

/**
 * Very rough heuristic: peak hours (5-9am, 3-7pm local) get higher
 * estimates. This is a placeholder so the UI always has *something*
 * to show. Swap with a real API later.
 */
function estimateByTime(date: Date): { minutes: number; label: "low" | "medium" | "high" } {
  const h = date.getHours();
  if ((h >= 5 && h < 9) || (h >= 15 && h < 19)) {
    return { minutes: 25, label: "high" };
  }
  if ((h >= 9 && h < 15) || (h >= 19 && h < 22)) {
    return { minutes: 12, label: "medium" };
  }
  return { minutes: 5, label: "low" };
}

export async function getTsaInfo(
  iata: string,
  forDate: Date = new Date(),
): Promise<TsaInfo | null> {
  const ap = lookupAirport(iata);
  if (!ap) return null;
  const est = estimateByTime(forDate);
  return {
    iata: ap.iata,
    name: ap.name,
    officialUrl: ap.tsaUrl,
    estimateMinutes: est.minutes,
    estimateLabel: est.label,
    source: ap.tsaUrl ? "official-link" : "estimate",
    notes: ap.tsaUrl
      ? "Tap to see live TSA wait times from the airport."
      : "Estimate based on time of day — airport doesn't publish live numbers.",
  };
}
