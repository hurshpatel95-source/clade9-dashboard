import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { FlightCard } from "@/components/FlightCard";
import { AddFlightDialog } from "@/components/AddFlightDialog";
import { Sparkles, Plane, Settings as SettingsIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [flights, family] = await Promise.all([
    prisma.flight.findMany({
      orderBy: { scheduledDate: "asc" },
      include: { familyMember: true },
    }),
    prisma.familyMember.findMany({ orderBy: { name: "asc" } }),
  ]);

  const now = Date.now();
  const inAir = flights.filter((f) => f.status === "active");
  const today: typeof flights = [];
  const upcoming: typeof flights = [];
  const past: typeof flights = [];

  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

  for (const f of flights) {
    if (f.status === "active") continue;
    const t = f.scheduledDate.getTime();
    if (t < startOfToday.getTime() && f.status !== "scheduled") past.push(f);
    else if (t <= endOfToday.getTime()) today.push(f);
    else upcoming.push(f);
  }

  return (
    <main className="space-y-8">
      <section className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
          <p className="text-sm text-zinc-500">
            {flights.length === 0
              ? "Add a flight to start tracking."
              : `${inAir.length} in air · ${today.length} today · ${upcoming.length} upcoming`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="btn-ghost">
            <SettingsIcon className="h-4 w-4" />
          </Link>
          <AddFlightDialog family={family.map((f) => ({ id: f.id, name: f.name }))} />
        </div>
      </section>

      {flights.length === 0 && <EmptyState />}

      {inAir.length > 0 && (
        <Section title="In the air right now" tone="emerald">
          {inAir.map((f) => <FlightCard key={f.id} flight={f} />)}
        </Section>
      )}

      {today.length > 0 && (
        <Section title="Today">
          {today.map((f) => <FlightCard key={f.id} flight={f} />)}
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Upcoming">
          {upcoming.map((f) => <FlightCard key={f.id} flight={f} />)}
        </Section>
      )}

      {past.length > 0 && (
        <Section title="Past" muted>
          {past.slice(0, 5).map((f) => <FlightCard key={f.id} flight={f} />)}
        </Section>
      )}
    </main>
  );
}

function Section({
  title,
  children,
  tone,
  muted,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "emerald";
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className={`mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide ${
        muted ? "text-zinc-400" : "text-zinc-500"
      }`}>
        {tone === "emerald" && <span className="h-2 w-2 animate-pulse-slow rounded-full bg-emerald-500" />}
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="card grid place-items-center gap-3 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10">
        <Plane className="h-6 w-6 -rotate-45" />
      </span>
      <div>
        <p className="font-medium">No flights yet</p>
        <p className="mt-1 text-sm text-zinc-500">
          Add your first flight — we'll pull live status, gates, and a map.
        </p>
      </div>
      <p className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500">
        <Sparkles className="h-3 w-3" />
        Tip: set your home location in <Link href="/settings" className="underline">Settings</Link> first to get drive-time + leave-by alerts.
      </p>
    </div>
  );
}
