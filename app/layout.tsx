import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Plane, Users, Home } from "lucide-react";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "Sammy's AI Flight Tracker",
  description: "Live flights, TSA, drive-time, and inbound-aircraft tracking — for the family.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
  ],
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
      <body className="min-h-screen">
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:pt-10">
          <header className="mb-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-blue-600 text-white shadow-card">
                <Plane className="h-5 w-5 -rotate-45" />
              </span>
              <div>
                <div className="text-base font-semibold leading-tight">Sammy&rsquo;s AI Flight Tracker</div>
                <div className="text-xs text-zinc-500">Family edition</div>
              </div>
            </Link>
            <nav className="flex items-center gap-1">
              <Link href="/" className="btn-ghost">
                <Home className="h-4 w-4" /> <span className="hidden sm:inline">Today</span>
              </Link>
              <Link href="/family" className="btn-ghost">
                <Users className="h-4 w-4" /> <span className="hidden sm:inline">Family</span>
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
