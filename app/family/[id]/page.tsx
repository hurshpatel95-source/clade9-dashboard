import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { FlightCard } from "@/components/FlightCard";
import { FamilyAvatar } from "@/components/FamilyAvatar";

export const dynamic = "force-dynamic";

export default async function FamilyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await prisma.familyMember.findUnique({
    where: { id },
    include: {
      flights: {
        orderBy: { scheduledDate: "desc" },
        include: { familyMember: true },
      },
    },
  });
  if (!member) notFound();

  const upcoming = member.flights.filter(
    (f) => f.scheduledDate.getTime() >= Date.now() - 6 * 60 * 60 * 1000,
  );
  const past = member.flights.filter(
    (f) => f.scheduledDate.getTime() < Date.now() - 6 * 60 * 60 * 1000,
  );

  return (
    <main className="space-y-6">
      <Link href="/family" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ChevronLeft className="h-4 w-4" /> Family
      </Link>

      <header className="flex items-center gap-4">
        <FamilyAvatar name={member.name} emoji={member.emoji} color={member.color} size={56} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{member.name}</h1>
          <p className="text-sm text-zinc-500">
            {member.flights.length} {member.flights.length === 1 ? "flight" : "flights"}
            {member.email && <> · {member.email}</>}
          </p>
        </div>
      </header>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">Upcoming</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((f) => <FlightCard key={f.id} flight={f} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">Past</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {past.map((f) => <FlightCard key={f.id} flight={f} />)}
          </div>
        </section>
      )}

      {member.flights.length === 0 && (
        <div className="card grid place-items-center py-12 text-sm text-zinc-500">
          No flights for {member.name} yet.
        </div>
      )}
    </main>
  );
}
