/**
 * AviationStack wrapper.
 *
 * Free tier: 100 requests / day, HTTP only on the free plan.
 * Docs: https://aviationstack.com/documentation
 *
 * We intentionally keep the surface small — one fetch per flight number +
 * date — and cache the result on the Flight row. The dashboard refresh
 * button + a server action are the only callers, so we don't burn quota.
 */

const BASE = process.env.AVIATIONSTACK_KEY?.startsWith("live_")
  ? "https://api.aviationstack.com/v1"
  : "http://api.aviationstack.com/v1"; // free tier is HTTP-only

export type FlightSnapshot = {
  status?: string;
  airline?: string;
  departureIata?: string;
  arrivalIata?: string;
  scheduledDep?: string;
  estimatedDep?: string;
  actualDep?: string;
  scheduledArr?: string;
  estimatedArr?: string;
  actualArr?: string;
  depGate?: string;
  depTerminal?: string;
  arrGate?: string;
  arrTerminal?: string;
  aircraftIata?: string;
  liveLat?: number;
  liveLng?: number;
  liveAltitude?: number;
  liveSpeed?: number;
  liveDirection?: number;
};

/** Snapshot of the *inbound* leg flown by the same aircraft. */
export type InboundSnapshot = {
  status?: string;
  departureIata?: string;
  arrivalIata?: string;
  scheduledArr?: string;
  estimatedArr?: string;
  actualArr?: string;
  liveLat?: number;
  liveLng?: number;
};

type AviationStackFlight = {
  flight_status?: string;
  airline?: { name?: string; iata?: string };
  flight?: { iata?: string; number?: string };
  departure?: {
    iata?: string;
    scheduled?: string;
    estimated?: string;
    actual?: string;
    gate?: string;
    terminal?: string;
  };
  arrival?: {
    iata?: string;
    scheduled?: string;
    estimated?: string;
    actual?: string;
    gate?: string;
    terminal?: string;
  };
  aircraft?: { iata?: string };
  live?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    speed_horizontal?: number;
    direction?: number;
  };
};

type AviationStackResponse = {
  data?: AviationStackFlight[];
  error?: { code: string; message: string };
};

/**
 * Look up the latest snapshot for a flight number.
 * `date` is the local departure date (YYYY-MM-DD) — AviationStack accepts
 * `flight_date` as a filter; if omitted it returns the most recent.
 */
export async function fetchFlightSnapshot(
  flightNumber: string,
  date?: string,
): Promise<FlightSnapshot | null> {
  const key = process.env.AVIATIONSTACK_KEY;
  if (!key) {
    // No key configured — return null so callers can show "set your API key"
    // rather than crash.
    return null;
  }

  const params = new URLSearchParams({
    access_key: key,
    flight_iata: flightNumber.toUpperCase(),
    limit: "1",
  });
  if (date) params.set("flight_date", date);

  const url = `${BASE}/flights?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json()) as AviationStackResponse;
  if (json.error) {
    console.error("AviationStack error:", json.error);
    return null;
  }
  const f = json.data?.[0];
  if (!f) return null;

  return {
    status: f.flight_status,
    airline: f.airline?.name,
    departureIata: f.departure?.iata,
    arrivalIata: f.arrival?.iata,
    scheduledDep: f.departure?.scheduled,
    estimatedDep: f.departure?.estimated,
    actualDep: f.departure?.actual,
    scheduledArr: f.arrival?.scheduled,
    estimatedArr: f.arrival?.estimated,
    actualArr: f.arrival?.actual,
    depGate: f.departure?.gate,
    depTerminal: f.departure?.terminal,
    arrGate: f.arrival?.gate,
    arrTerminal: f.arrival?.terminal,
    aircraftIata: f.aircraft?.iata,
    liveLat: f.live?.latitude,
    liveLng: f.live?.longitude,
    liveAltitude: f.live?.altitude,
    liveSpeed: f.live?.speed_horizontal,
    liveDirection: f.live?.direction,
  };
}

/**
 * Fetch the inbound leg flown by the same aircraft.
 *
 * The user supplies the inbound flight number manually (FlightAware shows
 * it on the flight detail page as "Aircraft last seen on …"). This call
 * grabs that flight's status so we can answer "is the plane going to be
 * on time to my gate?".
 */
export async function fetchInboundSnapshot(
  inboundFlightNumber: string,
  date?: string,
): Promise<InboundSnapshot | null> {
  const snap = await fetchFlightSnapshot(inboundFlightNumber, date);
  if (!snap) return null;
  return {
    status: snap.status,
    departureIata: snap.departureIata,
    arrivalIata: snap.arrivalIata,
    scheduledArr: snap.scheduledArr,
    estimatedArr: snap.estimatedArr,
    actualArr: snap.actualArr,
    liveLat: snap.liveLat,
    liveLng: snap.liveLng,
  };
}

/**
 * Compare the inbound aircraft's projected arrival to the outbound's
 * scheduled departure and return a human verdict.
 *
 * Airlines typically need ≥45 min on the ground for a turn — if the inbound
 * lands less than that before scheduled departure, expect a delay.
 */
export type TurnaroundVerdict = {
  status: "ok" | "tight" | "late" | "unknown";
  groundMinutes: number | null;
  message: string;
};

export function analyzeTurnaround(args: {
  outboundScheduledDep?: Date | string | null;
  inboundEstimatedArr?: Date | string | null;
  inboundActualArr?: Date | string | null;
  inboundScheduledArr?: Date | string | null;
  inboundStatus?: string | null;
  minTurnMinutes?: number;
}): TurnaroundVerdict {
  const min = args.minTurnMinutes ?? 45;
  const dep = args.outboundScheduledDep
    ? new Date(args.outboundScheduledDep)
    : null;
  const arr =
    args.inboundActualArr ??
    args.inboundEstimatedArr ??
    args.inboundScheduledArr;
  const arrDate = arr ? new Date(arr) : null;

  if (!dep || !arrDate) {
    return { status: "unknown", groundMinutes: null, message: "Inbound arrival unknown" };
  }
  const ground = Math.round((dep.getTime() - arrDate.getTime()) / 60_000);
  if (args.inboundStatus === "landed") {
    if (ground >= min) {
      return { status: "ok", groundMinutes: ground, message: `Plane landed — ${ground} min on ground before push-back` };
    }
    return { status: "tight", groundMinutes: ground, message: `Plane landed — only ${ground} min before push-back, expect delay` };
  }
  if (ground >= min) {
    return { status: "ok", groundMinutes: ground, message: `Inbound projected ${ground} min before departure — should be on time` };
  }
  if (ground >= 0) {
    return { status: "tight", groundMinutes: ground, message: `Tight turn — only ${ground} min between inbound landing and your departure` };
  }
  return { status: "late", groundMinutes: ground, message: `Inbound lands ${Math.abs(ground)} min after your scheduled departure — delay likely` };
}

