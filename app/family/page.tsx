import Link from "next/link";
import { prisma } from "@/lib/db";
import { AddFamilyDialog } from "@/components/AddFamilyDialog";
import { FamilyAvatar } from "@/components/FamilyAvatar";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const family = await prisma.familyMember.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { flights: true } } },
  });

  return (
    <main className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Family</h1>
          <p className="text-sm text-zinc-500">
            {family.length === 0
              ? "Add the people you want to keep tabs on."
              : `${family.length} ${family.length === 1 ? "person" : "people"} tracked`}
          </p>
        </div>
        <AddFamilyDialog />
      </div>

      {family.length === 0 ? (
        <div className="card grid place-items-center py-16 text-center text-sm text-zinc-500">
          No family members yet — tap "Add family" to start.
        </div>
      ) : (
        <ul className="card divide-y hairline">
          {family.map((m) => (
            <li key={m.id}>
              <Link
                href={`/family/${m.id}`}
                className="flex items-center gap-3 p-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <FamilyAvatar name={m.name} emoji={m.emoji} color={m.color} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-zinc-500">
                    {m._count.flights} {m._count.flights === 1 ? "flight" : "flights"}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
