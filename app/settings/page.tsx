import Link from "next/link";
import { ChevronLeft, MapPin } from "lucide-react";
import { getSettings, saveSettings } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <main className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ChevronLeft className="h-4 w-4" /> Today
      </Link>

      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500">
          Used to compute drive-time + leave-by for every flight.
        </p>
      </header>

      <form action={saveSettings} className="card space-y-5 p-5">
        <div>
          <label className="label">Home / pickup label</label>
          <input
            name="homeLabel"
            defaultValue={s.homeLabel ?? ""}
            placeholder="Home"
            className="input mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Latitude</label>
            <input
              name="homeLat"
              type="number"
              step="0.0001"
              defaultValue={s.homeLat ?? ""}
              placeholder="37.7749"
              className="input mt-1 font-mono"
            />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input
              name="homeLng"
              type="number"
              step="0.0001"
              defaultValue={s.homeLng ?? ""}
              placeholder="-122.4194"
              className="input mt-1 font-mono"
            />
          </div>
        </div>

        <p className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Tip: open Google Maps on your phone, long-press your home, copy the lat/lng. Or open
            <a className="underline" href="https://www.latlong.net/" target="_blank" rel="noreferrer"> latlong.net</a>.
          </span>
        </p>

        <div>
          <label className="label">Be at the gate this many minutes before departure</label>
          <input
            name="gateBufferMinutes"
            type="number"
            min={15}
            max={240}
            defaultValue={s.gateBufferMinutes}
            className="input mt-1 font-mono"
          />
          <p className="mt-1 text-xs text-zinc-500">60 is good for domestic, 90+ for international.</p>
        </div>

        <button type="submit" className="btn-primary w-full">Save settings</button>
      </form>

      <p className="text-xs text-zinc-500">
        For real traffic-aware drive times, set <code>GOOGLE_MAPS_KEY</code> in your <code>.env</code>.
        Without it we use a straight-line estimate.
      </p>
    </main>
  );
}
