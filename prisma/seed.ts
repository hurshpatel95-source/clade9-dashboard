/**
 * Pre-fills the DB with:
 *   - Home location: 16 Stevenson Dr, Marlboro NJ (approx — refine in /settings)
 *   - "Hursh" as a family member
 *   - AA66 JFK → BCN tonight, 6:35 PM boarding, gate 45, terminal 8
 *
 * Run with:   npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ----- Settings: home location ----------------------------------
  // 16 Stevenson Dr, Marlboro NJ ~= 40.310, -74.255 (approx — open
  // /settings on the deployed app and tweak after Google verifies).
  await prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      homeLabel: "16 Stevenson Dr, Marlboro NJ",
      homeLat: 40.310,
      homeLng: -74.255,
      gateBufferMinutes: 90, // international flight — bump from 60
    },
    update: {
      homeLabel: "16 Stevenson Dr, Marlboro NJ",
      homeLat: 40.310,
      homeLng: -74.255,
      gateBufferMinutes: 90,
    },
  });

  // ----- Family member -------------------------------------------
  const hursh = await prisma.familyMember.upsert({
    where: { id: "seed-hursh" },
    create: {
      id: "seed-hursh",
      name: "Hursh",
      emoji: "🧳",
      color: "#0A84FF",
    },
    update: {},
  });

  // ----- AA 66 JFK -> BCN tonight ---------------------------------
  // Boarding 6:35 PM ET → scheduled departure ~7:05 PM ET.
  const today = new Date();
  const dep = new Date(today);
  dep.setHours(19, 5, 0, 0); // 7:05 PM local

  await prisma.flight.upsert({
    where: { id: "seed-aa66" },
    create: {
      id: "seed-aa66",
      flightNumber: "AA66",
      airline: "American Airlines",
      departureIata: "JFK",
      arrivalIata: "BCN",
      scheduledDate: today,
      scheduledDep: dep,
      depGate: "45",
      depTerminal: "8",
      status: "scheduled",
      familyMemberId: hursh.id,
      notes: "Boarding 6:35 PM · Seat 26L · Group 5 · Confirmation HGUFJT",
    },
    update: {
      scheduledDep: dep,
      depGate: "45",
      depTerminal: "8",
    },
  });

  console.log("✅ Seed complete: home, Hursh, AA66 JFK→BCN tonight.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
