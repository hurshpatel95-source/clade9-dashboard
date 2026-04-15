import { Plane, ArrowDownToLine } from "lucide-react";
import { StatusPill } from "./StatusPill";
import { fmtTime } from "@/lib/utils";
import type { TurnaroundVerdict } from "@/lib/flightApi";

const TONES = {
  ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  tight: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  late: "bg-red-500/10 text-red-700 dark:text-red-400",
  unknown: "bg-zinc-500/10 text-zinc-600",
} as const;

export function InboundCard({
  inboundFlightNumber,
  status,
  depIata,
  arrIata,
  scheduledArr,
  estimatedArr,
  actualArr,
  verdict,
}: {
  inboundFlightNumber: string;
  status?: string | null;
  depIata?: string | null;
  arrIata?: string | null;
  scheduledArr?: Date | null;
  estimatedArr?: Date | null;
  actualArr?: Date | null;
  verdict: TurnaroundVerdict;
}) {
  const arr = actualArr ?? estimatedArr ?? scheduledArr;
  return (
    <div className="card">
      <div className="flex items-center justify-between border-b hairline p-4">
        <div className="flex items-center gap-2">
          <ArrowDownToLine className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Inbound aircraft
          </h3>
        </div>
        <StatusPill status={status} />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-zinc-400 -rotate-45" />
          <span className="font-mono font-medium">{inboundFlightNumber}</span>
          {depIata && arrIata && (
            <span className="text-sm text-zinc-500">
              · {depIata} → {arrIata}
            </span>
          )}
        </div>
        <div className="text-sm text-zinc-500">
          Lands {fmtTime(arr)}
          {scheduledArr && estimatedArr && estimatedArr.getTime() !== scheduledArr.getTime() && (
            <span className="ml-1 line-through opacity-60">{fmtTime(scheduledArr)}</span>
          )}
        </div>
        <div className={`rounded-xl p-3 text-sm ${TONES[verdict.status]}`}>
          {verdict.message}
        </div>
      </div>
    </div>
  );
}
