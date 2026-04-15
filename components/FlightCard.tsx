import Link from "next/link";
import type { Flight, FamilyMember } from "@prisma/client";
import { ArrowRight, Plane } from "lucide-react";
import { StatusPill } from "./StatusPill";
import { FamilyAvatar } from "./FamilyAvatar";
import { fmtTime, fmtDate, delayMinutes } from "@/lib/utils";

type FlightWithMember = Flight & { familyMember: FamilyMember | null };

export function FlightCard({ flight }: { flight: FlightWithMember }) {
  const dep = flight.estimatedDep ?? flight.scheduledDep ?? flight.scheduledDate;
  const delay = delayMinutes(flight.scheduledDep, flight.estimatedDep ?? flight.actualDep);
  const isDelayed = delay !== null && delay >= 10;

  return (
    <Link
      href={`/flight/${flight.id}`}
      className="card group block transition hover:shadow-md"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
          <Plane className="h-5 w-5 -rotate-45" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">{flight.flightNumber}</span>
            {flight.airline && (
              <span className="truncate text-xs text-zinc-500">{flight.airline}</span>
            )}
            <span className="ml-auto"><StatusPill status={flight.status} /></span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="font-mono">{flight.departureIata ?? "—"}</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
            <span className="font-mono">{flight.arrivalIata ?? "—"}</span>
            <span className="ml-auto text-zinc-500">
              {fmtDate(dep)} · {fmtTime(dep)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-500">
              {flight.familyMember && (
                <span className="inline-flex items-center gap-1.5">
                  <FamilyAvatar
                    name={flight.familyMember.name}
                    emoji={flight.familyMember.emoji}
                    color={flight.familyMember.color}
                    size={18}
                  />
                  <span>{flight.familyMember.name}</span>
                </span>
              )}
              {flight.depGate && <span>· Gate {flight.depGate}</span>}
              {flight.depTerminal && <span>· T{flight.depTerminal}</span>}
            </div>
            {isDelayed && (
              <span className="pill bg-amber-500/10 text-amber-600 dark:text-amber-400">
                +{delay}m delay
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
