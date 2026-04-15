import { ExternalLink, Map, UtensilsCrossed, Search } from "lucide-react";
import type { Airport } from "@/lib/airports";

/**
 * Surfaces "what's on the way to my gate" — terminal map + dining.
 *
 * We don't try to render an interactive indoor map ourselves (no clean
 * free API). Instead we deep-link to:
 *  - the airport's own terminal map (best for "where is gate B12")
 *  - the airport's dining directory (best for "what restaurants are in T2")
 *  - a Google Maps "food near here" search at the terminal coords (great
 *    fallback — Google has indoor maps for most major US airports and
 *    actual reviews for the eateries inside).
 *
 * Only renders on the day of departure to keep the UI uncluttered.
 */
export function TerminalCard({
  airport,
  gate,
  terminal,
}: {
  airport: Airport;
  gate?: string | null;
  terminal?: string | null;
}) {
  const foodSearchUrl =
    `https://www.google.com/maps/search/restaurants/@${airport.lat},${airport.lng},17z`;

  return (
    <div className="card">
      <div className="flex items-center gap-2 border-b hairline p-4">
        <Map className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Terminal & food
        </h3>
        <span className="ml-auto text-xs text-zinc-500">
          {airport.iata}
          {terminal && ` · T${terminal}`}
          {gate && ` · Gate ${gate}`}
        </span>
      </div>
      <ul className="divide-y hairline">
        {airport.terminalMapUrl && (
          <li>
            <a
              href={airport.terminalMapUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
                <Map className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Terminal map</div>
                <div className="text-xs text-zinc-500">
                  Find your gate {gate ? `(${gate})` : ""} and walking routes
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-zinc-400" />
            </a>
          </li>
        )}
        {airport.diningUrl && (
          <li>
            <a
              href={airport.diningUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10">
                <UtensilsCrossed className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Food & shops</div>
                <div className="text-xs text-zinc-500">Official directory of dining options</div>
              </div>
              <ExternalLink className="h-4 w-4 text-zinc-400" />
            </a>
          </li>
        )}
        <li>
          <a
            href={foodSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <Search className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Food on Google Maps</div>
              <div className="text-xs text-zinc-500">
                Indoor map view with reviews — works for most major airports
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-zinc-400" />
          </a>
        </li>
      </ul>
    </div>
  );
}
