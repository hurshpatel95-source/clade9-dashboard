import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Plane, Users, Home } from "lucide-react";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Sammy's AI Flight Tracker",
  description: "Live flights, TSA, drive-time, and inbound-aircraft tracking — for the family.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Sammy's Flights",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Auto-toggle dark class based on OS pref before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const m=matchMedia('(prefers-color-scheme: dark)');const set=()=>document.documentElement.classList.toggle('dark',m.matches);set();m.addEventListener('change',set);}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-[100dvh]">
        <div
          className="mx-auto max-w-2xl px-4 pt-5 sm:max-w-3xl sm:pt-8"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom) + 88px)",
          }}
        >
          <header className="mb-5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-white shadow-card">
                <Plane className="h-5 w-5 -rotate-45" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold leading-tight">
                  Sammy&rsquo;s AI Flight Tracker
                </div>
                <div className="text-[11px] text-zinc-500">Family edition</div>
              </div>
            </Link>
            {/* Desktop-only nav — mobile uses BottomNav */}
            <nav className="hidden items-center gap-1 sm:flex">
              <Link href="/" className="btn-ghost">
                <Home className="h-4 w-4" /> <span>Today</span>
              </Link>
              <Link href="/family" className="btn-ghost">
                <Users className="h-4 w-4" /> <span>Family</span>
              </Link>
            </nav>
          </header>
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
