/**
 * Drive-time-to-airport helper.
 *
 * Destination = the flight's *departure* airport (the one you have to
 * physically get to). Origin = the user's saved "home" location from
 * the Settings row.
 *
 * Uses Google Distance Matrix when GOOGLE_MAPS_KEY is set (gives real
 * traffic-aware ETA); otherwise falls back to a Haversine straight-line
 * estimate so the UI still has something to show.
 */

import { lookupAirport } from "./airports";

export type Origin = { lat: number; lng: number; label?: string };

export type DriveEstimate = {
  origin: Origin;
  destinationIata: string;
  destinationName: string;
  minutesNoTraffic: number;
  minutesWithTraffic: number;
  distanceMiles: number;
  source: "google" | "haversine";
  trafficNote?: string;
};

function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8; // miles
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export async function estimateDriveTime(
  /** Departure airport of the flight (where the user needs to be). */
  airportIata: string,
  /** Where the user is leaving *from* — required, taken from Settings. */
  origin: Origin,
  /** Departure timestamp — Google uses this for traffic-aware routing. */
  departure: Date = new Date(),
): Promise<DriveEstimate | null> {
  const ap = lookupAirport(airportIata);
  if (!ap) return null;
  const dest = { lat: ap.lat, lng: ap.lng };
  const key = process.env.GOOGLE_MAPS_KEY;

  // No key → straight-line fallback. ~35 mph effective city speed.
  if (!key) {
    const miles = haversineMiles(origin, dest);
    const noTraffic = Math.round((miles / 35) * 60);
    return {
      origin,
      destinationIata: ap.iata,
      destinationName: ap.name,
      minutesNoTraffic: noTraffic,
      minutesWithTraffic: Math.round(noTraffic * 1.25),
      distanceMiles: Math.round(miles * 10) / 10,
      source: "haversine",
      trafficNote: "Estimate (no Google Maps key). Add GOOGLE_MAPS_KEY for real traffic.",
    };
  }

  const params = new URLSearchParams({
    origins: `${origin.lat},${origin.lng}`,
    destinations: `${dest.lat},${dest.lng}`,
    mode: "driving",
    departure_time: Math.max(
      Math.floor(departure.getTime() / 1000),
      Math.floor(Date.now() / 1000),
    ).toString(),
    traffic_model: "best_guess",
    units: "imperial",
    key,
  });
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const el = json?.rows?.[0]?.elements?.[0];
    if (!el || el.status !== "OK") return null;

    const noTraffic = Math.round(el.duration.value / 60);
    const withTraffic = Math.round((el.duration_in_traffic?.value ?? el.duration.value) / 60);
    const distMiles =
      typeof el.distance?.text === "string"
        ? parseFloat(el.distance.text.replace(/[^0-9.]/g, ""))
        : Math.round(haversineMiles(origin, dest) * 10) / 10;

    return {
      origin,
      destinationIata: ap.iata,
      destinationName: ap.name,
      minutesNoTraffic: noTraffic,
      minutesWithTraffic: withTraffic,
      distanceMiles: distMiles,
      source: "google",
      trafficNote:
        withTraffic > noTraffic * 1.2
          ? `Traffic is heavy — adds ~${withTraffic - noTraffic} min.`
          : "Traffic looks normal.",
    };
  } catch {
    return null;
  }
}

/**
 * Build a Google Maps directions URL the user can tap to navigate live.
 * Avoids re-implementing turn-by-turn — Google does it better.
 */
export function navUrl(origin: Origin, airportIata: string): string {
  const ap = lookupAirport(airportIata);
  const dest = ap ? `${ap.lat},${ap.lng}` : airportIata;
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest}&travelmode=driving`;
}
