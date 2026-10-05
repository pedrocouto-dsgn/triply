import type { PlaceImage } from "./types";

// Unsplash place photos. Requires UNSPLASH_ACCESS_KEY (server-only). Without it every
// caller falls back to the illustrated placeholder. Results are cached for 30 days so a
// destination costs one API request per month, within the free demo rate limit.
const CACHE_SECONDS = 60 * 60 * 24 * 30;
const UTM = "utm_source=triply&utm_medium=referral";

type SearchResponse = { results?: { urls?: { raw?: string }; alt_description?: string | null; links?: { html?: string; download_location?: string }; user?: { name?: string; links?: { html?: string } } }[] };

export async function getPlacePhoto(query: string): Promise<PlaceImage | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  const normalized = query.trim().replace(/\s+/g, " ");
  if (!key || !normalized) return null;
  try {
    const url = `https://api.unsplash.com/search/photos?${new URLSearchParams({ query: normalized, per_page: "1", orientation: "landscape", content_filter: "high" })}`;
    const response = await fetch(url, { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" }, next: { revalidate: CACHE_SECONDS, tags: ["unsplash"] } });
    if (!response.ok) return null;
    const photo = ((await response.json()) as SearchResponse).results?.[0];
    if (!photo?.urls?.raw || !photo.user?.name) return null;
    // Unsplash API guidelines: register the use of a photo via its download endpoint (cached alongside the search).
    if (photo.links?.download_location) void fetch(photo.links.download_location, { headers: { Authorization: `Client-ID ${key}` }, next: { revalidate: CACHE_SECONDS, tags: ["unsplash"] } }).catch(() => undefined);
    const separator = photo.urls.raw.includes("?") ? "&" : "?";
    return {
      src: `${photo.urls.raw}${separator}w=1920&q=80&auto=format&fit=crop`,
      alt: photo.alt_description ?? normalized,
      credit: { name: photo.user.name, profileUrl: `${photo.user.links?.html ?? "https://unsplash.com"}?${UTM}`, sourceUrl: `https://unsplash.com/?${UTM}`, source: "Unsplash" },
    };
  } catch {
    return null;
  }
}
