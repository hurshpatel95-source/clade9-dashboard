# Sammy's AI Flight Tracker

Family-flight dashboard. Add upcoming trips, group them by family member,
and watch live status, delays, gates, TSA waits, drive-time-to-airport,
and inbound-aircraft turnarounds — all in one Apple-clean view.

Built with **Next.js 14 + Prisma + Tailwind**. Deployable to Railway in
~5 minutes.

---

## Features

- **Family-grouped tracking** — add people you care about, attach flights to them
- **Live status** via [FlightAware AeroAPI](https://flightaware.com/aeroapi) (free tier: ~$5/mo credit, ~1000 queries)
- **Auto inbound-aircraft detection** — AeroAPI's `/aircraft/{tail}/flights` endpoint tells us where the plane currently is, no manual lookup
- **Live flight map** — origin, destination, and the plane's current position (Leaflet + CARTO tiles)
- **Smart insights** — combines TSA wait + traffic-aware drive time + your gate buffer to tell you
  *"leave by 4:42 PM"*
- **Inbound aircraft tracking** — link the previous leg of the same plane; we'll warn if it's
  going to land too late for a clean turn (the trick power-users use)
- **Time at destination** — live-ticking local clock at the arrival airport, plus arrival times
  shown in destination timezone
- **Terminal & food** — within 24 h of departure, deep-links to the airport's terminal map,
  dining directory, and a Google Maps food-search at the terminal
- **Light/dark mode** — follows OS preference

---

## Quick start (local)

```bash
# 1. Install
npm install

# 2. Create your env file
cp .env.example .env
# Edit .env and add at minimum FLIGHTAWARE_KEY (free at aviationstack.com)

# 3. Initialize the DB
npx prisma db push

# 4. Run
npm run dev
# → open http://localhost:3000
```

First-run order:

1. Open `/settings` and enter your home lat/lng (long-press home in Google Maps to copy)
2. Add a family member at `/family`
3. Add a flight from the dashboard

---

## Deploy to Railway

This app is set up to deploy cleanly on [Railway](https://railway.app).

### 1. Switch SQLite → Postgres

Edit `prisma/schema.prisma`:

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

Commit the change.

### 2. Push the repo to GitHub

```bash
git push -u origin main
```

### 3. On Railway

1. **New Project → Deploy from GitHub** → pick this repo
2. Railway auto-detects Next.js. Confirm the build/start commands:
   - Build: `npm run build`
   - Start: `npm run start`
3. **+ New → Database → PostgreSQL**. Railway will inject `DATABASE_URL` automatically.
4. **Variables tab** — add:
   - `FLIGHTAWARE_KEY` — required for live data
   - `GOOGLE_MAPS_KEY` — *optional* but unlocks real traffic-aware drive times
5. **Settings → Deploy → Pre-Deploy Command**:
   ```
   npx prisma db push --skip-generate
   ```
   This creates/updates the tables on every deploy. Safe and idempotent.
6. Click **Deploy**. When it's live, hit your Railway URL, open `/settings`, set your home,
   and start adding flights.

### 4. (Optional) Custom domain

Railway → Settings → Networking → Custom Domain. Point a CNAME at the
Railway-provided host. Done.

---

## Environment variables

| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres URL (Railway injects this); local dev defaults to SQLite |
| `FLIGHTAWARE_KEY` | ✅ | Live flight status; free tier 100 req/day |
| `GOOGLE_MAPS_KEY` | ❌ | Real traffic-aware drive time (otherwise we use a straight-line estimate) |
| `SHARED_PASSCODE` | ❌ | Reserved — light passcode gate, not yet wired in v1 |

---

## Seeding example data

A starter `prisma/seed.ts` pre-fills:

- Home location: 16 Stevenson Dr, Marlboro NJ
- Family member: Hursh
- AA 66 JFK → BCN today, gate 45, terminal 8

Run after the DB is up:

```bash
npx prisma db seed
```

Edit `prisma/seed.ts` to change. Refine the home lat/lng inside the
deployed app at `/settings`.

## What's intentionally not in v1

- **Auth** — single shared account; gate with `SHARED_PASSCODE` later or wire up Clerk/Auth.js
- **Push notifications** — planned via PWA + Web Push (free, no Twilio). Phase 2.
- **Auto-detect of inbound aircraft** — for now, paste the inbound flight number manually
  (FlightAware shows it as *"Aircraft last seen on…"*)

---

## Project layout

```
app/
  page.tsx               # dashboard
  family/                # family list + per-person view
  flight/[id]/page.tsx   # flight detail (map, insights, inbound, terminal)
  settings/              # home location + gate buffer
components/              # FlightCard, InsightCard, InboundCard, TerminalCard, ...
lib/
  airports.ts            # IATA → coords/tz/TSA + dining URLs
  flightApi.ts           # FlightAware AeroAPI wrapper + turnaround analysis
  driveTime.ts           # Google Distance Matrix (or Haversine fallback)
  tsa.ts                 # TSA wait estimate + official-link
  insights.ts            # leave-by planner
  actions.ts             # server actions (CRUD + refresh + settings)
  db.ts                  # Prisma client singleton
prisma/schema.prisma
```

---

## Adding more airports

Edit `lib/airports.ts` — each row needs `iata`, `name`, `city`, `lat`,
`lng`, `tz`. Optional: `tsaUrl`, `terminalMapUrl`, `diningUrl`. The UI
picks them up automatically.
