import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an ISO date as "Apr 15 · 2:35 PM" in the viewer's local TZ. */
export function fmtDateTime(iso?: string | Date | null): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Just the time (e.g. "2:35 PM"). */
export function fmtTime(iso?: string | Date | null, tz?: string): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  });
}

/** Time + IANA timezone short name, e.g. "2:35 PM EST". */
export function fmtTimeWithZone(iso?: string | Date | null, tz?: string): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
    timeZoneName: "short",
  });
}

/** Hour offset between two IANA timezones (positive = b is ahead of a). */
export function hoursBetweenZones(a: string, b: string, when: Date = new Date()): number {
  const fmt = (tz: string) =>
    new Date(when.toLocaleString("en-US", { timeZone: tz })).getTime();
  return Math.round((fmt(b) - fmt(a)) / 3_600_000);
}

/** Just the date (e.g. "Apr 15"). */
export function fmtDate(iso?: string | Date | null): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

/** Compute "in 2h 15m" / "3h 4m ago" from now. */
export function relTime(iso?: string | Date | null): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60_000);
  const hours = Math.floor(mins / 60);
  const m = mins % 60;
  const human =
    hours > 0 ? `${hours}h${m ? ` ${m}m` : ""}` : `${mins}m`;
  return diff >= 0 ? `in ${human}` : `${human} ago`;
}

/** Difference in minutes between scheduled and estimated/actual. */
export function delayMinutes(
  scheduled?: Date | string | null,
  actual?: Date | string | null,
): number | null {
  if (!scheduled || !actual) return null;
  const s = new Date(scheduled).getTime();
  const a = new Date(actual).getTime();
  if (Number.isNaN(s) || Number.isNaN(a)) return null;
  return Math.round((a - s) / 60_000);
}

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  scheduled: { label: "Scheduled", tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  active: { label: "In Air", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  landed: { label: "Landed", tone: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400" },
  cancelled: { label: "Cancelled", tone: "bg-red-500/10 text-red-600 dark:text-red-400" },
  incident: { label: "Incident", tone: "bg-red-500/10 text-red-600 dark:text-red-400" },
  diverted: { label: "Diverted", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

export function statusBadge(status?: string | null) {
  if (!status) return { label: "Pending", tone: "bg-zinc-500/10 text-zinc-500" };
  return STATUS_COPY[status] ?? { label: status, tone: "bg-zinc-500/10 text-zinc-500" };
}

/** Pick a stable color from the family member's name. */
export function tintFromName(name: string): string {
  const palette = [
    "#0A84FF", "#FF453A", "#FF9F0A", "#30D158",
    "#BF5AF2", "#FF375F", "#64D2FF", "#FFD60A",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}
