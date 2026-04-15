import { Car, ShieldCheck, Clock, Sparkles, ExternalLink } from "lucide-react";
import type { DriveEstimate } from "@/lib/driveTime";
import type { TsaInfo } from "@/lib/tsa";
import type { LeaveByPlan } from "@/lib/insights";
import { fmtTime } from "@/lib/utils";

const URGENCY_TONES = {
  calm: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "heads-up": "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "leave-now": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  missed: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
} as const;

export function InsightCard({
  plan,
  drive,
  tsa,
  navUrl,
}: {
  plan: LeaveByPlan | null;
  drive: DriveEstimate | null;
  tsa: TsaInfo | null;
  navUrl: string | null;
}) {
  return (
    <div className="card divide-y hairline">
      <div className="flex items-center gap-2 p-4">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Smart insights
        </h3>
      </div>

      {plan ? (
        <div className={`m-4 rounded-2xl border p-4 ${URGENCY_TONES[plan.urgency]}`}>
          <div className="text-xs uppercase tracking-wide opacity-70">Leave by</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">{fmtTime(plan.leaveBy)}</div>
          <p className="mt-1 text-sm">{plan.message}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-80">
            <span>Drive {plan.breakdown.driveMin}m</span>
            <span>+ TSA ~{plan.breakdown.tsaMin}m</span>
            <span>+ Gate buffer {plan.breakdown.gateBufferMin}m</span>
            <span>= Boarding by {fmtTime(new Date(plan.breakdown.departureUsed.getTime() - plan.breakdown.gateBufferMin * 60_000))}</span>
          </div>
        </div>
      ) : (
        <div className="m-4 rounded-2xl border hairline p-4 text-sm text-zinc-500">
          Set your home location in <a href="/settings" className="underline">Settings</a> to see a leave-by time.
        </div>
      )}

      <div className="grid sm:grid-cols-2">
        <div className="flex items-start gap-3 p-4">
          <Car className="mt-0.5 h-4 w-4 text-zinc-500" />
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wide text-zinc-500">Drive to airport</div>
            {drive ? (
              <>
                <div className="mt-0.5 text-base font-medium">
                  {drive.minutesWithTraffic} min
                  {drive.minutesWithTraffic !== drive.minutesNoTraffic && (
                    <span className="ml-1 text-xs text-zinc-500">
                      ({drive.minutesNoTraffic} typical)
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  {drive.distanceMiles} mi to {drive.destinationIata}
                </div>
                {drive.trafficNote && (
                  <div className="mt-1 text-xs text-zinc-500">{drive.trafficNote}</div>
                )}
                {navUrl && (
                  <a
                    href={navUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    Open in Google Maps <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </>
            ) : (
              <div className="text-sm text-zinc-500">Set your home location to see drive time.</div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 border-l hairline p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-zinc-500" />
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wide text-zinc-500">TSA wait time</div>
            {tsa ? (
              <>
                <div className="mt-0.5 text-base font-medium">
                  ~{tsa.estimateMinutes} min
                  <span className="ml-1 text-xs text-zinc-500">({tsa.estimateLabel})</span>
                </div>
                <div className="text-xs text-zinc-500">{tsa.notes}</div>
                {tsa.officialUrl && (
                  <a
                    href={tsa.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    Live numbers from {tsa.iata} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </>
            ) : (
              <div className="text-sm text-zinc-500">No TSA data for this airport.</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 text-xs text-zinc-500">
        <Clock className="h-3 w-3" />
        Updates each time you refresh the flight.
      </div>
    </div>
  );
}
