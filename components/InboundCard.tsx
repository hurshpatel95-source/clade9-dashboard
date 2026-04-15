import Link from "next/link";
import type { Flight, FamilyMember } from "@prisma/client";
import { Plane, ArrowDownToLine, ChevronRight, Sparkles } from "lucide-react";
import { StatusPill } from "./StatusPill";
import { fmtTime } from "@/lib/utils";
import type { FlightSnapshot, TurnaroundVerdict } from "@/lib/flightApi";

const TONES = {
  ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  tight: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  late: "bg-red-500/10 text-red-700 dark:text-red-400",
  unknown: "bg-zinc-500/10 text-zinc-600",
} as const;

export type InboundSource =
  | { kind: "tracked"; flight: Flight & { familyMember: FamilyMember | null } }
  | { kind: "aero"; snapshot: FlightSnapshot };

/**
 * Shown when the plane that will fly this leg is already identifiable,
 * either because another tracked flight shares its tail OR because
 * FlightAware's /aircraft/{tail}/flights endpoint surfaced the inbound.
 */
export function InboundCard({
  source,
  verdict,
}: {
  source: InboundSource;
  verdict: TurnaroundVerdict;
}) {
  if (source.kind === "tracked") {
    const inbound = source.flight;
    const arr = inbound.actualArr ?? inbound.estimatedArr ?? inbound.scheduledArr;
    return (
      <Shell
        title="Same plane inbound"
        rightBadge={<StatusPill status={inbound.status} />}
      >
        <Link
          href={`/flight/${inbound.id}`}
          className="block space-y-3 p-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          <Row
            flightNumber={inbound.flightNumber}
            dep={inbound.departureIata}
            arr={inbound.arrivalIata}
            tail={inbound.aircraftIata}
            linkable
          />
          <TimeLine
            arr={arr}
            scheduled={inbound.scheduledArr}
            estimated={inbound.estimatedArr}
          />
          <Verdict verdict={verdict} />
        </Link>
      </Shell>
    );
  }

  // AeroAPI-sourced, not tracked in our DB.
  const snap = source.snapshot;
  const arrStr = snap.actualArr ?? snap.estimatedArr ?? snap.scheduledArr;
  return (
    <Shell
      title="Same plane inbound"
      rightBadge={<StatusPill status={snap.status} />}
    >
      <div className="space-y-3 p-4">
        <Row
          flightNumber={"—"}
          dep={snap.departureIata}
          arr={snap.arrivalIata}
          tail={snap.aircraftIata}
        />
        <TimeLine
          arr={arrStr ? new Date(arrStr) : null}
          scheduled={snap.scheduledArr ? new Date(snap.scheduledArr) : null}
          estimated={snap.estimatedArr ? new Date(snap.estimatedArr) : null}
        />
        <Verdict verdict={verdict} />
        <p className="flex items-center gap-1 text-[11px] text-zinc-500">
          <Sparkles className="h-3 w-3" /> Auto-detected via FlightAware
        </p>
      </div>
    </Shell>
  );
}

function Shell({
  title,
  rightBadge,
  children,
}: {
  title: string;
  rightBadge: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between border-b hairline p-4">
        <div className="flex items-center gap-2">
          <ArrowDownToLine className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            {title}
          </h3>
        </div>
        {rightBadge}
      </div>
      {children}
    </div>
  );
}

function Row({
  flightNumber,
  dep,
  arr,
  tail,
  linkable,
}: {
  flightNumber: string;
  dep?: string | null;
  arr?: string | null;
  tail?: string | null;
  linkable?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Plane className="h-4 w-4 text-zinc-400 -rotate-45" />
      <span className="font-mono font-medium">{flightNumber}</span>
      {dep && arr && (
        <span className="text-sm text-zinc-500">
          · {dep} → {arr}
        </span>
      )}
      {tail && (
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {tail}
        </span>
      )}
      {linkable && <ChevronRight className="ml-auto h-4 w-4 text-zinc-400" />}
    </div>
  );
}

function TimeLine({
  arr,
  scheduled,
  estimated,
}: {
  arr: Date | null | undefined;
  scheduled: Date | null | undefined;
  estimated: Date | null | undefined;
}) {
  return (
    <div className="text-sm text-zinc-500">
      Lands {fmtTime(arr)}
      {scheduled && estimated && estimated.getTime() !== scheduled.getTime() && (
        <span className="ml-1 line-through opacity-60">{fmtTime(scheduled)}</span>
      )}
    </div>
  );
}

function Verdict({ verdict }: { verdict: TurnaroundVerdict }) {
  return (
    <div className={`rounded-xl p-3 text-sm ${TONES[verdict.status]}`}>
      {verdict.message}
    </div>
  );
}
