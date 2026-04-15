"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { saveFamilyMember } from "@/lib/actions";

export function AddFamilyDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <UserPlus className="h-4 w-4" /> Add family
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
              <h2 className="text-base font-semibold">Add a family member</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action={saveFamilyMember} className="space-y-4 p-4">
              <div>
                <label className="label">Name</label>
                <input required name="name" className="input mt-1" placeholder="Mom" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Emoji</label>
                  <input name="emoji" maxLength={4} className="input mt-1" placeholder="👩" />
                </div>
                <div>
                  <label className="label">Color</label>
                  <input type="color" name="color" defaultValue="#0A84FF" className="input mt-1 h-[42px] p-1" />
                </div>
              </div>
              <div>
                <label className="label">Phone <span className="normal-case text-zinc-400">(future SMS alerts)</span></label>
                <input name="phone" className="input mt-1" placeholder="+1 555 555 5555" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" name="email" className="input mt-1" />
              </div>
              <button type="submit" className="btn-primary w-full">Save</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
