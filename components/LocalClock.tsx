"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

/**
 * Live-ticking clock for the destination's timezone.
 * Updates every 30s — enough for "what time is it there" without churn.
 */
export function LocalClock({
  tz,
  city,
  className,
}: {
  tz: string;
  city: string;
  className?: string;
}) {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  });
  const dayName = now.toLocaleDateString(undefined, {
    weekday: "short",
    timeZone: tz,
  });
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs text-zinc-500 ${className ?? ""}`}>
      <Clock className="h-3 w-3" />
      <span>
        {time} <span className="opacity-70">{dayName} in {city}</span>
      </span>
    </div>
  );
}
