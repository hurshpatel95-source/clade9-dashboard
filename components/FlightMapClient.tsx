"use client";

import dynamic from "next/dynamic";

// Leaflet uses `window`, so we load it client-only. Next 15 forbids
// `ssr: false` dynamic imports in server components, hence this wrapper.
export const FlightMapClient = dynamic(
  () => import("./FlightMap").then((m) => m.FlightMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-72 place-items-center rounded-2xl border hairline text-sm text-zinc-500">
        Loading map…
      </div>
    ),
  },
);
