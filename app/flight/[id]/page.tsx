import dynamicImport from "next/dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronLeft, Plane, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { StatusPill } from "@/components/StatusPill";
import { FamilyAvatar } from "@/components/FamilyAvatar";
import { RefreshButton } from "@/components/RefreshButton";
import { InsightCard } from "@/components/InsightCard";
import { InboundCard } from "@/components/InboundCard";
import { LocalClock } from "@/components/LocalClock";
import { TerminalCard } from "@/components/TerminalCard";
import { lookupAirport } from "@/lib/airports";
import { estimateDriveTime, navUrl } from "@/lib/driveTime";
import { getTsaInfo } from "@/lib/tsa";
import { buildLeaveByPlan } from "@/lib/insights";
import { analyzeTurnaround } from "@/lib/flightApi";
import { getSettings } from "@/lib/actions";
import { fmtDate, fmtTime, fmtTimeWithZone, delayMinutes, relTime, hoursBetweenZones } from "@/lib/utils";
import { deleteFlight } from "@/lib/actions";

// Leaflet uses window — render only on the client.
const FlightMap = dynamicImport(() => import("@/components/FlightMap").then((m) => m.FlightMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-72 place-items-center rounded-2xl border hairline text-sm text-zinc-500">
      Loading map…
    </div>
  ),
});

export const dynamic = "force-dynamic";

export default async function FlightDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [flight, settings] = await Promise.all([
    prisma.flight.findUnique({ where: { id }, include: { familyMember: true } }),
    getSettings(),
  ]);
  if (!flight) notFound();

  const dep = lookupAirport(flight.departureIata);
  const arr = lookupAirport(flight.arrivalIata);
  const effectiveDep = flight.estimatedDep ?? flight.scheduledDep ?? flight.scheduledDate;
  const delay = delayMinutes(flight.scheduledDep, flight.estimatedDep ?? flight.actualDep);

  // Smart insights — only meaningful pre-departure and when home set.
  const home =
    settings.homeLat != null && settings.homeLng != null
      ? { lat: settings.homeLat, lng: settings.homeLng, label: settings.homeLabel ?? "Home" }
      : null;

  const drive = home && flight.departureIata
    ? await estimateDriveTime(flight.departureIata, home, effectiveDep)
    : null;
  const tsa = flight.departureIata ? await getTsaInfo(flight.departureIata, effectiveDep) : null;
  const plan = drive && tsa
    ? buildLeaveByPlan({
        effectiveDeparture: effectiveDep,
        drive,
        tsa,
        gateBufferMinutes: settings.gateBufferMinutes,
      })
    : null;
  const navHref = home && flight.departureIata ? navUrl(home, flight.departureIata) : null;

  const inboundVerdict = flight.inboundFlightNumber
    ? analyzeTurnaround({
        outboundScheduledDep: flight.scheduledDep ?? flight.scheduledDate,
        inboundEstimatedArr: flight.inboundEstimatedArr,
        inboundActualArr: flight.inboundActualArr,
        inboundScheduledArr: flight.inboundScheduledArr,
        inboundStatus: flight.inboundStatus,
      })
    : null;

  return (
    <main className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          <ChevronLeft className="h-4 w-4" /> Today
        </Link>
        <div className="flex items-center gap-2">
          <RefreshButton flightId={flight.id} />
          <form
            action={async () => {
              "use server";
              await deleteFlight(flight.id);
            }}
          >
            <button type="submit" className="btn-ghost text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* --- Hero --- */}
      <header className="card p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
            <Plane className="h-5 w-5 -rotate-45" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{flight.flightNumber}</h1>
              <StatusPill status={flight.status} />
            </div>
            {flight.airline && (
              <p className="text-sm text-zinc-500">{flight.airline}</p>
            )}
          </div>
          {flight.familyMember && (
            <Link
              href={`/family/${flight.familyMember.id}`}
              className="flex items-center gap-2 rounded-full border hairline px-2 py-1"
            >
              <FamilyAvatar
                name={flight.familyMember.name}
                emoji={flight.familyMember.emoji}
                color={flight.familyMember.color}
                size={22}
              />
              <span className="pr-1 text-sm">{flight.familyMember.name}</span>
            </Link>
          )}
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Endpoint
            iata={flight.departureIata}
            name={dep?.name}
            time={flight.estimatedDep ?? flight.scheduledDep}
            scheduled={flight.scheduledDep}
            gate={flight.depGate}
            terminal={flight.depTerminal}
            tz={dep?.tz}
          />
          <ArrowRight className="h-4 w-4 text-zinc-400" />
          <Endpoint
            iata={flight.arrivalIata}
            name={arr?.name}
            time={flight.estimatedArr ?? flight.scheduledArr}
            scheduled={flight.scheduledArr}
            gate={flight.arrGate}
            terminal={flight.arrTerminal}
            tz={arr?.tz}
            align="right"
          />
        </div>

        {arr && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t hairline pt-4">
            <LocalClock tz={arr.tz} city={arr.city} />
            {dep && arr.tz !== dep.tz && (
              <span className="text-xs text-zinc-500">
                · {Math.abs(hoursBetweenZones(dep.tz, arr.tz))}h{" "}
                {hoursBetweenZones(dep.tz, arr.tz) >= 0 ? "ahead of" : "behind"} {dep.city}
              </span>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
          <span>{fmtDate(flight.scheduledDate)}</span>
          {delay !== null && delay >= 10 && (
            <span className="pill bg-amber-500/10 text-amber-600 dark:text-amber-400">
              Delayed +{delay}m
            </span>
          )}
          {flight.aircraftIata && <span>· Aircraft {flight.aircraftIata}</span>}
          {flight.lastSyncedAt && <span className="ml-auto">Updated {relTime(flight.lastSyncedAt)}</span>}
        </div>

        {flight.notes && (
          <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            {flight.notes}
          </p>
        )}
      </header>

      {/* --- Map --- */}
      <FlightMap
        origin={dep ? { lat: dep.lat, lng: dep.lng, label: `${dep.iata} — ${dep.city}` } : null}
        destination={arr ? { lat: arr.lat, lng: arr.lng, label: `${arr.iata} — ${arr.city}` } : null}
        livePosition={
          flight.liveLat != null && flight.liveLng != null
            ? { lat: flight.liveLat, lng: flight.liveLng, label: `${flight.flightNumber} live` }
            : null
        }
      />

      {/* --- Smart insights (drive + TSA + leave-by) --- */}
      <InsightCard plan={plan} drive={drive} tsa={tsa} navUrl={navHref} />

      {/* --- Terminal map & food (only within 24h of departure) --- */}
      {dep && Math.abs(effectiveDep.getTime() - Date.now()) <= 24 * 60 * 60 * 1000 && (
        <TerminalCard airport={dep} gate={flight.depGate} terminal={flight.depTerminal} />
      )}

      {/* --- Inbound aircraft --- */}
      {flight.inboundFlightNumber && inboundVerdict && (
        <InboundCard
          inboundFlightNumber={flight.inboundFlightNumber}
          status={flight.inboundStatus}
          depIata={flight.inboundDepIata}
          arrIata={flight.inboundArrIata}
          scheduledArr={flight.inboundScheduledArr}
          estimatedArr={flight.inboundEstimatedArr}
          actualArr={flight.inboundActualArr}
          verdict={inboundVerdict}
        />
      )}
    </main>
  );
}

function Endpoint({
  iata,
  name,
  time,
  scheduled,
  gate,
  terminal,
  tz,
  align = "left",
}: {
  iata?: string | null;
  name?: string;
  time?: Date | null;
  scheduled?: Date | null;
  gate?: string | null;
  terminal?: string | null;
  tz?: string;
  align?: "left" | "right";
}) {
  const delayed =
    scheduled && time && time.getTime() - scheduled.getTime() >= 10 * 60_000;
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="font-mono text-2xl font-semibold tracking-tight">{iata ?? "—"}</div>
      {name && <div className="truncate text-xs text-zinc-500">{name}</div>}
      <div className="mt-2 text-sm">
        {tz ? fmtTimeWithZone(time, tz) : fmtTime(time)}
        {delayed && scheduled && (
          <span className="ml-1 text-xs text-zinc-400 line-through">
            {tz ? fmtTime(scheduled, tz) : fmtTime(scheduled)}
          </span>
        )}
      </div>
      {(gate || terminal) && (
        <div className="text-xs text-zinc-500">
          {terminal && `T${terminal}`}
          {terminal && gate && " · "}
          {gate && `Gate ${gate}`}
        </div>
      )}
    </div>
  );
}
