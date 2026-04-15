"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet's default marker icon paths under bundlers that don't
// rewrite CSS image URLs (Next.js).
const planeIcon = L.divIcon({
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: `
    <div style="
      width:28px;height:28px;border-radius:9999px;
      background:#0A84FF;color:#fff;display:grid;place-items:center;
      box-shadow:0 4px 12px rgba(10,132,255,0.45);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(-45deg);">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
      </svg>
    </div>
  `,
});

const dotIcon = (color: string) =>
  L.divIcon({
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
  });

type Pt = { lat: number; lng: number; label: string };

function FitBounds({ points }: { points: Pt[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const b = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(b, { padding: [40, 40], maxZoom: 8 });
  }, [points, map]);
  return null;
}

export function FlightMap({
  origin,
  destination,
  livePosition,
}: {
  origin?: { lat: number; lng: number; label: string } | null;
  destination?: { lat: number; lng: number; label: string } | null;
  livePosition?: { lat: number; lng: number; label?: string } | null;
}) {
  const points = useMemo(() => {
    return [origin, destination, livePosition].filter(Boolean) as Pt[];
  }, [origin, destination, livePosition]);

  if (points.length === 0) {
    return (
      <div className="grid h-72 place-items-center rounded-2xl border hairline bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-500">
        Map will appear once we have a route or live position.
      </div>
    );
  }

  return (
    <div className="h-72 overflow-hidden rounded-2xl border hairline">
      <MapContainer
        center={[points[0].lat, points[0].lng]}
        zoom={4}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {origin && destination && (
          <Polyline
            positions={[
              [origin.lat, origin.lng],
              ...(livePosition ? [[livePosition.lat, livePosition.lng] as [number, number]] : []),
              [destination.lat, destination.lng],
            ]}
            pathOptions={{ color: "#0A84FF", weight: 2.5, dashArray: "6 6", opacity: 0.7 }}
          />
        )}
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={dotIcon("#0A84FF")}>
            <Popup>{origin.label}</Popup>
          </Marker>
        )}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={dotIcon("#30D158")}>
            <Popup>{destination.label}</Popup>
          </Marker>
        )}
        {livePosition && (
          <Marker position={[livePosition.lat, livePosition.lng]} icon={planeIcon}>
            <Popup>{livePosition.label ?? "In flight"}</Popup>
          </Marker>
        )}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}
