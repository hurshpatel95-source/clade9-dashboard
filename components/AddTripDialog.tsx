"use client";

import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { saveFlights } from "@/lib/actions";

type FamilyOption = { id: string; name: string };

type Leg = {
  flightNumber: string;
  scheduledDate: string;
  familyMemberId: string;
  notes: string;
};

const blankLeg = (date: string): Leg => ({
  flightNumber: "",
  scheduledDate: date,
  familyMemberId: "",
  notes: "",
});

export function AddTripDialog({
  family,
  variant = "primary",
}: {
  family: FamilyOption[];
  variant?: "primary" | "fab";
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [legs, setLegs] = useState<Leg[]>([blankLeg(today)]);

  function update(i: number, patch: Partial<Leg>) {
    setLegs((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLeg() {
    const last = legs[legs.length - 1];
    setLegs((prev) => [
      ...prev,
      blankLeg(last?.scheduledDate ?? today),
    ]);
  }
  function removeLeg(i: number) {
    setLegs((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <>
      {variant === "fab" ? (
        <button
          onClick={() => setOpen(true)}
          aria-label="Add flight"
          className="fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-white shadow-lg active:scale-95 sm:hidden"
        >
          <Plus className="h-6 w-6" />
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add flight
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-surface dark:bg-surface-dark shadow-card sm:max-w-lg sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between rounded-t-3xl border-b hairline bg-surface/95 p-4 backdrop-blur dark:bg-surface-dark/95 sm:rounded-t-2xl">
              <h2 className="text-base font-semibold">
                Add {legs.length === 1 ? "a flight" : `${legs.length} flights`}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={async (fd) => {
                await saveFlights(fd);
                setOpen(false);
                setLegs([blankLeg(today)]);
              }}
              className="flex-1 overflow-y-auto"
            >
              <div className="space-y-4 p-4">
                {legs.map((leg, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border hairline p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Leg {i + 1}
                      </span>
                      {legs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLeg(i)}
                          className="rounded-full p-1 text-red-500 hover:bg-red-500/10"
                          aria-label="Remove leg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Flight #</label>
                          <input
                            required
                            name={`legs[${i}][flightNumber]`}
                            value={leg.flightNumber}
                            onChange={(e) => update(i, { flightNumber: e.target.value })}
                            placeholder="UA123"
                            inputMode="text"
                            autoCapitalize="characters"
                            autoCorrect="off"
                            className="input mt-1 font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="label">Date</label>
                          <input
                            required
                            type="date"
                            name={`legs[${i}][scheduledDate]`}
                            value={leg.scheduledDate}
                            onChange={(e) => update(i, { scheduledDate: e.target.value })}
                            className="input mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label">Who&rsquo;s on this?</label>
                        <select
                          name={`legs[${i}][familyMemberId]`}
                          value={leg.familyMemberId}
                          onChange={(e) => update(i, { familyMemberId: e.target.value })}
                          className="input mt-1"
                        >
                          <option value="">— Unassigned —</option>
                          {family.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="label">Notes</label>
                        <textarea
                          name={`legs[${i}][notes]`}
                          value={leg.notes}
                          onChange={(e) => update(i, { notes: e.target.value })}
                          rows={2}
                          className="input mt-1"
                          placeholder="e.g. Mom visiting for Easter"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addLeg}
                  className="btn-ghost w-full"
                >
                  <Plus className="h-4 w-4" /> Add another flight
                </button>
              </div>

              <div className="sticky bottom-0 border-t hairline bg-surface/95 p-4 backdrop-blur dark:bg-surface-dark/95">
                <button type="submit" className="btn-primary w-full text-base">
                  Save {legs.length} {legs.length === 1 ? "flight" : "flights"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
