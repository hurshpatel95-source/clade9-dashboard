import { statusBadge } from "@/lib/utils";

export function StatusPill({ status }: { status?: string | null }) {
  const s = statusBadge(status);
  return <span className={`pill ${s.tone}`}>{s.label}</span>;
}
