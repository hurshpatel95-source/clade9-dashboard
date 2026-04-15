import Link from "next/link";
import type { Flight, FamilyMember } from "@prisma/client";
import { Plane, ArrowDownToLine, ChevronRight } from "lucide-react";
import { StatusPill } from "./StatusPill";
import { fmtTime } from "@/lib/utils";
import type { TurnaroundVerdict } from "@/lib/flightApi";

const TONES = {
  ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  tight: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  late: "bg-red-500/10 text-red-700 dark:text-red-400",
  unknown: "bg-zinc-500/10 text-zinc-600",
} as const;

/**
 * Shown when another tracked flight shares the same aircraft tail — i.e.
 * the plane that will operate this flight is already on its inbound leg
 * somewhere else. Tap through to that flight's full detail page.
 */
export function InboundCard({
  inbound,
  verdict,
}: {
  inbound: Flight & { familyMember: FamilyMember | null };
  verdict: TurnaroundVerdict;
}) {
  const arr = inbound.actualArr ?? inbound.estimatedArr ?? inbound.scheduledArr;
  return (
    <div className="card">
      <div className="flex items-center justify-between border-b hairline p-4">
        <div className="flex items-center gap-2">
          <ArrowDownToLine className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Same plane inbound
          </h3>
        </div>
        <StatusPill status={inbound.status} />
      </div>
      <Link
        href={`/flight/${inbound.id}`}
        className="block space-y-3 p-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
      >
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-zinc-400 -rotate-45" />
          <span className="font-mono font-medium">{inbound.flightNumber}</span>
          {inbound.departureIata && inbound.arrivalIata && (
            <span className="text-sm text-zinc-500">
              · {inbound.departureIata} → {inbound.arrivalIata}
            </span>
          )}
          <ChevronRight className="ml-auto h-4 w-4 text-zinc-400" />
        </div>
        <div className="text-sm text-zinc-500">
          Lands {fmtTime(arr)}
          {inbound.scheduledArr &&
            inbound.estimatedArr &&
            inbound.estimatedArr.getTime() !== inbound.scheduledArr.getTime() && (
              <span className="ml-1 line-through opacity-60">
                {fmtTime(inbound.scheduledArr)}
              </span>
            )}
          {inbound.aircraftIata && (
            <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {inbound.aircraftIata}
            </span>
          )}
        </div>
        <div className={`rounded-xl p-3 text-sm ${TONES[verdict.status]}`}>
          {verdict.message}
        </div>
      </Link>
    </div>
  );
}
