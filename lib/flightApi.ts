/**
 * FlightAware AeroAPI wrapper.
 *
 * Free tier: $5/month in free credits (~1000 queries) — plenty for a
 * family tracker. Quality of data is significantly better than
 * AviationStack: accurate gates/terminals, live positions, and the
 * `/aircraft/{tail}/flights` endpoint lets us auto-detect the inbound
 * leg without the user tracking it.
 *
 * Docs: https://flightaware.com/aeroapi/portal/documentation
 * Auth: `x-apikey` header. Base URL: https://aeroapi.flightaware.com/aeroapi
 */

const BASE = "https://aeroapi.flightaware.com/aeroapi";

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
  /** Aircraft registration / tail (e.g. "N789AN"). */
  aircraftIata?: string;
  liveLat?: number;
  liveLng?: number;
  liveAltitude?: number;
  liveSpeed?: number;
  liveDirection?: number;
};

/** Subset of an AeroAPI flight record we actually consume. */
type AeroFlight = {
  ident?: string;
  ident_iata?: string;
  fa_flight_id?: string;
  operator?: string;
  operator_iata?: string;
  registration?: string;
  aircraft_type?: string;
  origin?: { code_iata?: string; city?: string };
  destination?: { code_iata?: string; city?: string };
  scheduled_out?: string | null;
  estimated_out?: string | null;
  actual_out?: string | null;
  scheduled_in?: string | null;
  estimated_in?: string | null;
  actual_in?: string | null;
  gate_origin?: string | null;
  terminal_origin?: string | null;
  gate_destination?: string | null;
  terminal_destination?: string | null;
  status?: string;
  progress_percent?: number;
  last_position?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    groundspeed?: number;
    heading?: number;
  } | null;
};

// AeroAPI's `status` strings are user-facing ("En Route", "Scheduled",
// "Arrived / Gate Arrival", …). Normalise to the short codes our UI
// already understands.
function normaliseStatus(s?: string): string | undefined {
  if (!s) return undefined;
  const lower = s.toLowerCase();
  if (lower.includes("arriv") || lower.includes("landed")) return "landed";
  if (lower.includes("en route") || lower.includes("in air") || lower.includes("taxi")) return "active";
  if (lower.includes("cancel")) return "cancelled";
  if (lower.includes("divert")) return "diverted";
  if (lower.includes("delay") || lower.includes("scheduled")) return "scheduled";
  return "scheduled";
}

function toSnapshot(f: AeroFlight): FlightSnapshot {
  return {
    status: normaliseStatus(f.status),
    airline: f.operator ?? f.operator_iata,
    departureIata: f.origin?.code_iata,
    arrivalIata: f.destination?.code_iata,
    scheduledDep: f.scheduled_out ?? undefined,
    estimatedDep: f.estimated_out ?? undefined,
    actualDep: f.actual_out ?? undefined,
    scheduledArr: f.scheduled_in ?? undefined,
    estimatedArr: f.estimated_in ?? undefined,
    actualArr: f.actual_in ?? undefined,
    depGate: f.gate_origin ?? undefined,
    depTerminal: f.terminal_origin ?? undefined,
    arrGate: f.gate_destination ?? undefined,
    arrTerminal: f.terminal_destination ?? undefined,
    aircraftIata: f.registration ?? undefined,
    liveLat: f.last_position?.latitude,
    liveLng: f.last_position?.longitude,
    liveAltitude: f.last_position?.altitude,
    liveSpeed: f.last_position?.groundspeed,
    liveDirection: f.last_position?.heading,
  };
}

async function aero<T>(path: string): Promise<T | null> {
  const key = process.env.FLIGHTAWARE_KEY;
  if (!key) return null;
  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-apikey": key, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    console.error(`AeroAPI ${path} → ${res.status}`);
    return null;
  }
  return (await res.json()) as T;
}

/**
 * Look up the latest snapshot for a flight number on a given date.
 * `date` should be YYYY-MM-DD (departure date, local to origin).
 */
export async function fetchFlightSnapshot(
  flightNumber: string,
  date?: string,
): Promise<FlightSnapshot | null> {
  // Optional date filter: AeroAPI uses ISO8601 bounds.
  const qp = new URLSearchParams();
  if (date) {
    qp.set("start", `${date}T00:00:00Z`);
    qp.set("end", `${date}T23:59:59Z`);
  }
  const json = await aero<{ flights?: AeroFlight[] }>(
    `/flights/${encodeURIComponent(flightNumber)}${qp.toString() ? `?${qp}` : ""}`,
  );
  const f = json?.flights?.[0];
  if (!f) return null;
  return toSnapshot(f);
}

/**
 * Auto-detect the inbound leg flown by the same aircraft.
 *
 * Given a tail registration and the outbound flight's scheduled
 * departure, find the most recent leg that lands before it. This is
 * the killer feature: we don't need the user to track the inbound
 * flight separately — one API call surfaces it.
 */
export async function fetchInboundByTail(
  tail: string,
  beforeDeparture: Date,
): Promise<FlightSnapshot | null> {
  const json = await aero<{ flights?: AeroFlight[] }>(
    `/aircraft/${encodeURIComponent(tail)}/flights?max_pages=1`,
  );
  if (!json?.flights?.length) return null;

  // AeroAPI returns newest first. Find the most recent flight that
  // lands *before* our outbound pushes back.
  const cutoff = beforeDeparture.getTime();
  for (const f of json.flights) {
    const arr =
      f.actual_in ?? f.estimated_in ?? f.scheduled_in ?? null;
    if (!arr) continue;
    if (new Date(arr).getTime() <= cutoff) {
      return toSnapshot(f);
    }
  }
  return null;
}

// ---------- Turnaround analysis -----------------------------------------

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
