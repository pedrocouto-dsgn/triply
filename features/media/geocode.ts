// Keyless geocoding with OpenStreetMap Nominatim. Usage policy: identify the app, cache results
// (30 days here) and keep requests sequential — callers resolve stops one after another.
const CACHE_SECONDS = 60 * 60 * 24 * 30;
const USER_AGENT = "Triply/0.1 (travel planner; https://triply-plum.vercel.app)";

export type Coordinates = { lat: number; lon: number };

export async function geocodePlace(place: string, countryCode?: string | null, countryName?: string | null): Promise<Coordinates | null> {
  // Country codes typed by hand can be wrong (e.g. "HO" for Holanda), so fall back to looser searches.
  return await search(place, countryCode, countryName) ?? await search(place, null, countryName) ?? await search(place, null, null);
}

async function search(place: string, countryCode?: string | null, countryName?: string | null): Promise<Coordinates | null> {
  const params = new URLSearchParams({ q: countryName && !/^[A-Za-z]{2}$/.test(countryCode ?? "") ? `${place}, ${countryName}` : place, format: "jsonv2", limit: "1", "accept-language": "pt" });
  if (countryCode && /^[A-Za-z]{2}$/.test(countryCode)) params.set("countrycodes", countryCode.toLowerCase());
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, next: { revalidate: CACHE_SECONDS, tags: ["geocode"] } });
    if (!response.ok) return null;
    const [first] = (await response.json()) as { lat?: string; lon?: string }[];
    const lat = Number(first?.lat), lon = Number(first?.lon);
    return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
  } catch {
    return null;
  }
}

export async function geocodeStops<T extends { id: string; placeName: string; countryCode: string; countryName: string }>(stops: T[]): Promise<Record<string, Coordinates>> {
  const result: Record<string, Coordinates> = {};
  for (const stop of stops) {
    const point = await geocodePlace(stop.placeName, stop.countryCode, stop.countryName);
    if (point) result[stop.id] = point;
  }
  return result;
}
