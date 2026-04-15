/**
 * Lightweight lookup for the major US airports we care about.
 * Used for: rendering names, computing drive-time origin (lat/lng of the
 * airport), and surfacing the airport's own TSA wait time page.
 *
 * Easily extended — just add rows.
 */

export type Airport = {
  iata: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  /** IANA timezone — used for "local time at destination". */
  tz: string;
  /** Public page (or scraper endpoint) with TSA wait times, if known. */
  tsaUrl?: string;
  /** Official interactive terminal map. */
  terminalMapUrl?: string;
  /** Official dining / shops directory. */
  diningUrl?: string;
};

export const AIRPORTS: Record<string, Airport> = {
  ATL: { iata: "ATL", name: "Hartsfield–Jackson Atlanta", city: "Atlanta", lat: 33.6407, lng: -84.4277, tz: "America/New_York", tsaUrl: "https://www.atl.com/times/", terminalMapUrl: "https://www.atl.com/maps/", diningUrl: "https://www.atl.com/concessions/" },
  LAX: { iata: "LAX", name: "Los Angeles Intl",          city: "Los Angeles", lat: 33.9416, lng: -118.4085, tz: "America/Los_Angeles", tsaUrl: "https://www.flylax.com/lax-traffic-and-parking/security-wait-times", terminalMapUrl: "https://www.flylax.com/lax-maps", diningUrl: "https://www.flylax.com/dining-and-shopping" },
  ORD: { iata: "ORD", name: "Chicago O'Hare",            city: "Chicago", lat: 41.9742, lng: -87.9073, tz: "America/Chicago", tsaUrl: "https://www.flychicago.com/ohare/home/pages/default.aspx", terminalMapUrl: "https://www.flychicago.com/ohare/home/Pages/MapsDirections.aspx", diningUrl: "https://www.flychicago.com/ohare/dineshop/Pages/default.aspx" },
  DFW: { iata: "DFW", name: "Dallas/Fort Worth",         city: "Dallas", lat: 32.8998, lng: -97.0403, tz: "America/Chicago", tsaUrl: "https://www.dfwairport.com/security/", terminalMapUrl: "https://www.dfwairport.com/maps/", diningUrl: "https://www.dfwairport.com/eat/" },
  DEN: { iata: "DEN", name: "Denver Intl",               city: "Denver", lat: 39.8561, lng: -104.6737, tz: "America/Denver", tsaUrl: "https://www.flydenver.com/at_dia/security/", terminalMapUrl: "https://www.flydenver.com/at_dia/airport_maps/", diningUrl: "https://www.flydenver.com/shopping_dining/" },
  JFK: { iata: "JFK", name: "John F. Kennedy",           city: "New York", lat: 40.6413, lng: -73.7781, tz: "America/New_York", tsaUrl: "https://www.jfkairport.com/security-checkpoint-wait-times", terminalMapUrl: "https://www.jfkairport.com/at-airport/airport-maps", diningUrl: "https://www.jfkairport.com/at-airport/food-and-shops" },
  LGA: { iata: "LGA", name: "LaGuardia",                 city: "New York", lat: 40.7769, lng: -73.8740, tz: "America/New_York", tsaUrl: "https://www.laguardiaairport.com/security-checkpoint-wait-times", terminalMapUrl: "https://www.laguardiaairport.com/at-airport/airport-maps", diningUrl: "https://www.laguardiaairport.com/at-airport/food-and-shops" },
  EWR: { iata: "EWR", name: "Newark Liberty",            city: "Newark", lat: 40.6895, lng: -74.1745, tz: "America/New_York", tsaUrl: "https://www.newarkairport.com/security-checkpoint-wait-times", terminalMapUrl: "https://www.newarkairport.com/at-airport/airport-maps", diningUrl: "https://www.newarkairport.com/at-airport/food-and-shops" },
  SFO: { iata: "SFO", name: "San Francisco Intl",        city: "San Francisco", lat: 37.6213, lng: -122.3790, tz: "America/Los_Angeles", tsaUrl: "https://www.flysfo.com/flysfo/security-wait-times", terminalMapUrl: "https://www.flysfo.com/flysfo/terminal-maps", diningUrl: "https://www.flysfo.com/flysfo/dining" },
  SEA: { iata: "SEA", name: "Seattle–Tacoma",            city: "Seattle", lat: 47.4502, lng: -122.3088, tz: "America/Los_Angeles" },
  MIA: { iata: "MIA", name: "Miami Intl",                city: "Miami", lat: 25.7959, lng: -80.2870, tz: "America/New_York" },
  BOS: { iata: "BOS", name: "Boston Logan",              city: "Boston", lat: 42.3656, lng: -71.0096, tz: "America/New_York" },
  PHX: { iata: "PHX", name: "Phoenix Sky Harbor",        city: "Phoenix", lat: 33.4342, lng: -112.0116, tz: "America/Phoenix" },
  IAH: { iata: "IAH", name: "Houston Intercontinental",  city: "Houston", lat: 29.9844, lng: -95.3414, tz: "America/Chicago" },
  CLT: { iata: "CLT", name: "Charlotte Douglas",         city: "Charlotte", lat: 35.2140, lng: -80.9431, tz: "America/New_York" },
  MCO: { iata: "MCO", name: "Orlando Intl",              city: "Orlando", lat: 28.4312, lng: -81.3081, tz: "America/New_York" },
  LAS: { iata: "LAS", name: "Harry Reid Las Vegas",      city: "Las Vegas", lat: 36.0840, lng: -115.1537, tz: "America/Los_Angeles" },
  MSP: { iata: "MSP", name: "Minneapolis–St. Paul",      city: "Minneapolis", lat: 44.8848, lng: -93.2223, tz: "America/Chicago" },
  DTW: { iata: "DTW", name: "Detroit Metropolitan",      city: "Detroit", lat: 42.2162, lng: -83.3554, tz: "America/Detroit" },
  PHL: { iata: "PHL", name: "Philadelphia Intl",         city: "Philadelphia", lat: 39.8744, lng: -75.2424, tz: "America/New_York" },
  SAN: { iata: "SAN", name: "San Diego Intl",            city: "San Diego", lat: 32.7338, lng: -117.1933, tz: "America/Los_Angeles" },
  SJC: { iata: "SJC", name: "San José Mineta",           city: "San José", lat: 37.3639, lng: -121.9289, tz: "America/Los_Angeles" },
  OAK: { iata: "OAK", name: "Oakland Intl",              city: "Oakland", lat: 37.7126, lng: -122.2197, tz: "America/Los_Angeles" },
  AUS: { iata: "AUS", name: "Austin–Bergstrom",          city: "Austin", lat: 30.1945, lng: -97.6699, tz: "America/Chicago" },
  BNA: { iata: "BNA", name: "Nashville Intl",            city: "Nashville", lat: 36.1245, lng: -86.6782, tz: "America/Chicago" },
  RDU: { iata: "RDU", name: "Raleigh–Durham",            city: "Raleigh", lat: 35.8801, lng: -78.7880, tz: "America/New_York" },
  PDX: { iata: "PDX", name: "Portland Intl",             city: "Portland", lat: 45.5898, lng: -122.5951, tz: "America/Los_Angeles" },
  SLC: { iata: "SLC", name: "Salt Lake City Intl",       city: "Salt Lake City", lat: 40.7899, lng: -111.9791, tz: "America/Denver" },
  IAD: { iata: "IAD", name: "Washington Dulles",         city: "Washington", lat: 38.9531, lng: -77.4565, tz: "America/New_York" },
  DCA: { iata: "DCA", name: "Reagan National",           city: "Washington", lat: 38.8512, lng: -77.0402, tz: "America/New_York" },
  BWI: { iata: "BWI", name: "Baltimore/Washington",      city: "Baltimore", lat: 39.1754, lng: -76.6683, tz: "America/New_York" },
  HNL: { iata: "HNL", name: "Daniel K. Inouye Honolulu", city: "Honolulu", lat: 21.3187, lng: -157.9225, tz: "Pacific/Honolulu" },
  ANC: { iata: "ANC", name: "Ted Stevens Anchorage",     city: "Anchorage", lat: 61.1743, lng: -149.9963, tz: "America/Anchorage" },
  // International quick-adds — extend freely
  LHR: { iata: "LHR", name: "London Heathrow",           city: "London", lat: 51.4700, lng: -0.4543, tz: "Europe/London" },
  CDG: { iata: "CDG", name: "Paris Charles de Gaulle",   city: "Paris", lat: 49.0097, lng: 2.5479, tz: "Europe/Paris" },
  AMS: { iata: "AMS", name: "Amsterdam Schiphol",        city: "Amsterdam", lat: 52.3105, lng: 4.7683, tz: "Europe/Amsterdam" },
  FRA: { iata: "FRA", name: "Frankfurt am Main",         city: "Frankfurt", lat: 50.0379, lng: 8.5622, tz: "Europe/Berlin" },
  NRT: { iata: "NRT", name: "Tokyo Narita",              city: "Tokyo", lat: 35.7720, lng: 140.3929, tz: "Asia/Tokyo" },
  HND: { iata: "HND", name: "Tokyo Haneda",              city: "Tokyo", lat: 35.5494, lng: 139.7798, tz: "Asia/Tokyo" },
  ICN: { iata: "ICN", name: "Seoul Incheon",             city: "Seoul", lat: 37.4602, lng: 126.4407, tz: "Asia/Seoul" },
  SIN: { iata: "SIN", name: "Singapore Changi",          city: "Singapore", lat: 1.3644, lng: 103.9915, tz: "Asia/Singapore" },
  DXB: { iata: "DXB", name: "Dubai Intl",                city: "Dubai", lat: 25.2532, lng: 55.3657, tz: "Asia/Dubai" },
  YYZ: { iata: "YYZ", name: "Toronto Pearson",           city: "Toronto", lat: 43.6777, lng: -79.6248, tz: "America/Toronto" },
  YVR: { iata: "YVR", name: "Vancouver Intl",            city: "Vancouver", lat: 49.1939, lng: -123.1844, tz: "America/Vancouver" },
  MEX: { iata: "MEX", name: "Mexico City Intl",          city: "Mexico City", lat: 19.4361, lng: -99.0719, tz: "America/Mexico_City" },
  GRU: { iata: "GRU", name: "São Paulo Guarulhos",       city: "São Paulo", lat: -23.4356, lng: -46.4731, tz: "America/Sao_Paulo" },
  SYD: { iata: "SYD", name: "Sydney Kingsford Smith",    city: "Sydney", lat: -33.9399, lng: 151.1753, tz: "Australia/Sydney" },
};

export function lookupAirport(iata?: string | null): Airport | null {
  if (!iata) return null;
  return AIRPORTS[iata.toUpperCase()] ?? null;
}
