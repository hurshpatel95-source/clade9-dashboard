"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "./db";
import {
  fetchFlightSnapshot,
  fetchInboundSnapshot,
} from "./flightApi";

// ---------- Settings ------------------------------------------------------

const SettingsInput = z.object({
  homeLabel: z.string().max(80).optional().nullable(),
  homeLat: z.coerce.number().min(-90).max(90).optional().nullable(),
  homeLng: z.coerce.number().min(-180).max(180).optional().nullable(),
  gateBufferMinutes: z.coerce.number().int().min(15).max(240).default(60),
});

export async function saveSettings(formData: FormData) {
  const parsed = SettingsInput.parse({
    homeLabel: formData.get("homeLabel") || null,
    homeLat: formData.get("homeLat") || null,
    homeLng: formData.get("homeLng") || null,
    gateBufferMinutes: formData.get("gateBufferMinutes") || 60,
  });
  await prisma.settings.upsert({
    where: { id: "default" },
    create: { id: "default", ...parsed },
    update: parsed,
  });
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function getSettings() {
  return (
    (await prisma.settings.findUnique({ where: { id: "default" } })) ??
    (await prisma.settings.create({ data: { id: "default" } }))
  );
}

// ---------- Family members ------------------------------------------------

const FamilyInput = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required").max(80),
  emoji: z.string().max(8).optional().nullable(),
  color: z.string().max(16).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function saveFamilyMember(formData: FormData) {
  const parsed = FamilyInput.parse({
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name"),
    emoji: formData.get("emoji") || null,
    color: formData.get("color") || null,
    phone: formData.get("phone") || null,
    email: formData.get("email") || null,
    notes: formData.get("notes") || null,
  });

  const data = {
    name: parsed.name,
    emoji: parsed.emoji || null,
    color: parsed.color || null,
    phone: parsed.phone || null,
    email: parsed.email || null,
    notes: parsed.notes || null,
  };

  if (parsed.id) {
    await prisma.familyMember.update({ where: { id: parsed.id }, data });
  } else {
    await prisma.familyMember.create({ data });
  }
  revalidatePath("/");
  revalidatePath("/family");
}

export async function deleteFamilyMember(id: string) {
  await prisma.familyMember.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/family");
}

// ---------- Flights -------------------------------------------------------

const FlightInput = z.object({
  id: z.string().optional(),
  flightNumber: z
    .string()
    .min(2, "Flight number required")
    .max(10)
    .transform((v) => v.toUpperCase().replace(/\s+/g, "")),
  scheduledDate: z.string().min(1, "Date required"),
  familyMemberId: z.string().optional().nullable(),
  inboundFlightNumber: z
    .string()
    .max(10)
    .transform((v) => (v ? v.toUpperCase().replace(/\s+/g, "") : v))
    .optional()
    .nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function saveFlight(formData: FormData) {
  const parsed = FlightInput.parse({
    id: (formData.get("id") as string) || undefined,
    flightNumber: formData.get("flightNumber"),
    scheduledDate: formData.get("scheduledDate"),
    familyMemberId: (formData.get("familyMemberId") as string) || null,
    inboundFlightNumber: (formData.get("inboundFlightNumber") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  const data = {
    flightNumber: parsed.flightNumber,
    scheduledDate: new Date(parsed.scheduledDate),
    familyMemberId: parsed.familyMemberId || null,
    inboundFlightNumber: parsed.inboundFlightNumber || null,
    notes: parsed.notes || null,
  };

  let flightId = parsed.id;
  if (flightId) {
    await prisma.flight.update({ where: { id: flightId }, data });
  } else {
    const created = await prisma.flight.create({ data });
    flightId = created.id;
  }

  // Fire-and-forget initial snapshot (non-blocking from user's POV).
  await refreshFlight(flightId).catch(() => undefined);

  revalidatePath("/");
  redirect(`/flight/${flightId}`);
}

export async function deleteFlight(id: string) {
  await prisma.flight.delete({ where: { id } });
  revalidatePath("/");
}

/**
 * Bulk-add: each leg is one flight. Used by the "Add trip" mobile sheet
 * so a round-trip (or a multi-leg connection) can be saved in one tap.
 *
 * The form serializes legs as `legs[0][flightNumber]`, `legs[0][scheduledDate]`,
 * `legs[0][familyMemberId]`, etc.
 */
export async function saveFlights(formData: FormData) {
  const legs: Array<{
    flightNumber: string;
    scheduledDate: Date;
    familyMemberId: string | null;
    inboundFlightNumber: string | null;
    notes: string | null;
  }> = [];

  // Walk index 0..N until we run out of flight numbers.
  for (let i = 0; ; i++) {
    const fn = formData.get(`legs[${i}][flightNumber]`) as string | null;
    if (!fn) break;
    const date = formData.get(`legs[${i}][scheduledDate]`) as string | null;
    if (!date) continue;
    legs.push({
      flightNumber: fn.toUpperCase().replace(/\s+/g, ""),
      scheduledDate: new Date(date),
      familyMemberId: ((formData.get(`legs[${i}][familyMemberId]`) as string) || null) || null,
      inboundFlightNumber:
        ((formData.get(`legs[${i}][inboundFlightNumber]`) as string) || "").toUpperCase().replace(/\s+/g, "") || null,
      notes: (formData.get(`legs[${i}][notes]`) as string) || null,
    });
  }

  if (legs.length === 0) return;

  const created = await prisma.$transaction(
    legs.map((leg) => prisma.flight.create({ data: leg })),
  );

  // Fire snapshots for each, but don't block the user on rate-limited calls.
  await Promise.allSettled(created.map((f) => refreshFlight(f.id)));

  revalidatePath("/");
  revalidatePath("/family");
}

/**
 * Pull a fresh snapshot from AviationStack and persist it.
 * Also refreshes the inbound aircraft leg if `inboundFlightNumber` is set.
 */
export async function refreshFlight(id: string) {
  const f = await prisma.flight.findUnique({ where: { id } });
  if (!f) return;

  const ymd = f.scheduledDate.toISOString().slice(0, 10);
  const snap = await fetchFlightSnapshot(f.flightNumber, ymd);

  const update: Record<string, unknown> = { lastSyncedAt: new Date() };
  if (snap) {
    Object.assign(update, {
      status: snap.status ?? f.status,
      airline: snap.airline ?? f.airline,
      departureIata: snap.departureIata ?? f.departureIata,
      arrivalIata: snap.arrivalIata ?? f.arrivalIata,
      scheduledDep: snap.scheduledDep ? new Date(snap.scheduledDep) : f.scheduledDep,
      estimatedDep: snap.estimatedDep ? new Date(snap.estimatedDep) : f.estimatedDep,
      actualDep: snap.actualDep ? new Date(snap.actualDep) : f.actualDep,
      scheduledArr: snap.scheduledArr ? new Date(snap.scheduledArr) : f.scheduledArr,
      estimatedArr: snap.estimatedArr ? new Date(snap.estimatedArr) : f.estimatedArr,
      actualArr: snap.actualArr ? new Date(snap.actualArr) : f.actualArr,
      depGate: snap.depGate ?? f.depGate,
      depTerminal: snap.depTerminal ?? f.depTerminal,
      arrGate: snap.arrGate ?? f.arrGate,
      arrTerminal: snap.arrTerminal ?? f.arrTerminal,
      aircraftIata: snap.aircraftIata ?? f.aircraftIata,
      liveLat: snap.liveLat ?? f.liveLat,
      liveLng: snap.liveLng ?? f.liveLng,
      liveAltitude: snap.liveAltitude ?? f.liveAltitude,
      liveSpeed: snap.liveSpeed ?? f.liveSpeed,
      liveDirection: snap.liveDirection ?? f.liveDirection,
    });
  }

  if (f.inboundFlightNumber) {
    const inb = await fetchInboundSnapshot(f.inboundFlightNumber, ymd);
    if (inb) {
      Object.assign(update, {
        inboundStatus: inb.status,
        inboundDepIata: inb.departureIata,
        inboundArrIata: inb.arrivalIata,
        inboundScheduledArr: inb.scheduledArr ? new Date(inb.scheduledArr) : null,
        inboundEstimatedArr: inb.estimatedArr ? new Date(inb.estimatedArr) : null,
        inboundActualArr: inb.actualArr ? new Date(inb.actualArr) : null,
        inboundLiveLat: inb.liveLat,
        inboundLiveLng: inb.liveLng,
      });
    }
  }

  await prisma.flight.update({ where: { id }, data: update });
  revalidatePath("/");
  revalidatePath(`/flight/${id}`);
}
