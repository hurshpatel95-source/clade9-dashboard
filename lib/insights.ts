/**
 * "Smart" departure planner.
 *
 * Combines:
 *   - the flight's effective departure time (estimated > scheduled)
 *   - the airport's TSA wait estimate at that time
 *   - traffic-aware drive time from the user's saved home location
 *   - a configurable "be at gate by" buffer
 *
 * Returns a recommended "leave by" timestamp + a colour-coded urgency
 * so the dashboard can show "🚗 Leave in 22 min".
 */

import type { DriveEstimate } from "./driveTime";
import type { TsaInfo } from "./tsa";

export type LeaveByPlan = {
  /** When the user should walk out the door. */
  leaveBy: Date;
  /** Minutes from now until that time (negative = past). */
  minutesUntilLeave: number;
  /** Breakdown so the UI can explain the math. */
  breakdown: {
    departureUsed: Date;
    gateBufferMin: number;
    tsaMin: number;
    driveMin: number;
  };
  urgency: "calm" | "heads-up" | "leave-now" | "missed";
  message: string;
};

export function buildLeaveByPlan(args: {
  /** Whichever of estimatedDep / scheduledDep we trust most. */
  effectiveDeparture: Date;
  drive: Pick<DriveEstimate, "minutesWithTraffic"> | null;
  tsa: Pick<TsaInfo, "estimateMinutes"> | null;
  /** Minutes the user wants to be at the gate before scheduled departure. */
  gateBufferMinutes: number;
}): LeaveByPlan | null {
  if (!args.drive || !args.tsa) return null;

  const tsaMin = args.tsa.estimateMinutes;
  const driveMin = args.drive.minutesWithTraffic;
  const totalLeadMin = args.gateBufferMinutes + tsaMin + driveMin;

  const leaveBy = new Date(args.effectiveDeparture.getTime() - totalLeadMin * 60_000);
  const minutesUntilLeave = Math.round((leaveBy.getTime() - Date.now()) / 60_000);

  let urgency: LeaveByPlan["urgency"];
  let message: string;
  if (minutesUntilLeave < -10) {
    urgency = "missed";
    message = `Already ${Math.abs(minutesUntilLeave)} min past ideal departure — go now or you'll miss the gate.`;
  } else if (minutesUntilLeave <= 5) {
    urgency = "leave-now";
    message = "Leave now — every extra minute eats into your gate buffer.";
  } else if (minutesUntilLeave <= 30) {
    urgency = "heads-up";
    message = `Heads up — you should be out the door in ${minutesUntilLeave} min.`;
  } else {
    urgency = "calm";
    message = `Plenty of time — leave in ${formatLead(minutesUntilLeave)}.`;
  }

  return {
    leaveBy,
    minutesUntilLeave,
    breakdown: {
      departureUsed: args.effectiveDeparture,
      gateBufferMin: args.gateBufferMinutes,
      tsaMin,
      driveMin,
    },
    urgency,
    message,
  };
}

function formatLead(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
