"use client";

import { useTransition } from "react";
import { RotateCw } from "lucide-react";
import { refreshFlight } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function RefreshButton({ flightId, label = "Refresh" }: { flightId: string; label?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => refreshFlight(flightId))}
      className="btn-ghost"
      disabled={pending}
    >
      <RotateCw className={cn("h-4 w-4", pending && "animate-spin")} />
      {pending ? "Refreshing…" : label}
    </button>
  );
}
