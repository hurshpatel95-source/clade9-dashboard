"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { saveFlight } from "@/lib/actions";

type FamilyOption = { id: string; name: string };

export function AddFlightDialog({ family }: { family: FamilyOption[] }) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="h-4 w-4" /> Add flight
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/40 p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-surface dark:bg-surface-dark shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b hairline p-4">
              <h2 className="text-base font-semibold">Add a flight</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action={saveFlight} className="space-y-4 p-4">
              <div>
                <label className="label">Flight number</label>
                <input
                  required
                  name="flightNumber"
                  placeholder="UA123"
                  className="input mt-1 font-mono uppercase"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Departure date</label>
                <input
                  required
                  type="date"
                  name="scheduledDate"
                  defaultValue={today}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="label">Who's on this flight?</label>
                <select name="familyMemberId" className="input mt-1">
                  <option value="">— Unassigned —</option>
                  {family.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">
                  Inbound flight number <span className="normal-case text-zinc-400">(optional — same plane's previous leg)</span>
                </label>
                <input
                  name="inboundFlightNumber"
                  placeholder="UA456"
                  className="input mt-1 font-mono uppercase"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Track if the aircraft inbound to your gate is on time. Find this on FlightAware as
                  &ldquo;Aircraft last seen on…&rdquo;
                </p>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea name="notes" rows={2} className="input mt-1" placeholder="e.g. Mom visiting for Easter" />
              </div>
              <button type="submit" className="btn-primary w-full">Save flight</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
