import type { PlaceImage } from "./types";

// Keyless place photos from the Wikipedia REST summary (lead image of the place's article).
// Portuguese Wikipedia first (it resolves most pt-PT/pt-BR spellings via redirects), then English.
const CACHE_SECONDS = 60 * 60 * 24 * 30;
const USER_AGENT = "Triply/0.1 (travel planner; https://triply-plum.vercel.app)";
const PHOTO = /\.(jpe?g|png|webp)$/i;

type Summary = { type?: string; title?: string; originalimage?: { source?: string; width?: number }; thumbnail?: { source?: string; width?: number }; content_urls?: { desktop?: { page?: string } } };

async function summary(lang: "pt" | "en", title: string): Promise<Summary | null> {
  try {
    const response = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}?redirect=true`, { headers: { "Api-User-Agent": USER_AGENT, "User-Agent": USER_AGENT, Accept: "application/json" }, next: { revalidate: CACHE_SECONDS, tags: ["wikipedia"] } });
    return response.ok ? (await response.json()) as Summary : null;
  } catch {
    return null;
  }
}

/**
 * Photo URL for banners; skips maps, flags and other non-photo (SVG) lead images.
 * Wikimedia only serves standard thumbnail widths, so pick 1920 or 1280 when the original is larger.
 */
function photoUrl(data: Summary): string | null {
  const isPhoto = (url?: string) => Boolean(url && PHOTO.test(url.split("?")[0]) && !NOT_PHOTO.test(url));
  const original = data.originalimage, thumb = data.thumbnail?.source?.split("?")[0];
  if (!original?.source || !isPhoto(original.source)) return null;
  const width = original.width ?? 0;
  const step = width > 1920 ? 1920 : width > 1280 ? 1280 : 0;
  if (step && thumb && /\/\d+px-/.test(thumb)) return thumb.replace("://thumb.wikimedia.org/", "://upload.wikimedia.org/").replace(/\/\d+px-/, `/${step}px-`);
  return original.source.split("?")[0];
}

const NOT_PHOTO = /\.svg|flag|bandeira|map[a]?[_ .]|locator|location|coat[_ ]of[_ ]arms|bras%C3%A3o|brasão|logo|icon|symbol|seal|montage|collage/i;

/** First real photograph inside the article when its lead image is a flag, map or montage. */
async function articlePhoto(lang: "pt" | "en", title: string): Promise<string | null> {
  try {
    const api = `https://${lang}.wikipedia.org/w/api.php`;
    const init = { headers: { "Api-User-Agent": USER_AGENT, "User-Agent": USER_AGENT }, next: { revalidate: CACHE_SECONDS, tags: ["wikipedia"] } };
    const list = await fetch(`${api}?${new URLSearchParams({ action: "query", format: "json", redirects: "1", titles: title, prop: "images", imlimit: "40" })}`, init);
    if (!list.ok) return null;
    const pages = Object.values(((await list.json()) as { query?: { pages?: Record<string, { images?: { title: string }[] }> } }).query?.pages ?? {});
    const file = pages[0]?.images?.map((image) => image.title).find((name) => /\.(jpe?g)$/i.test(name) && !NOT_PHOTO.test(name));
    if (!file) return null;
    const info = await fetch(`${api}?${new URLSearchParams({ action: "query", format: "json", titles: file, prop: "imageinfo", iiprop: "url|size", iiurlwidth: "1920" })}`, init);
    if (!info.ok) return null;
    const page = Object.values(((await info.json()) as { query?: { pages?: Record<string, { imageinfo?: { thumburl?: string; url?: string; width?: number }[] }> } }).query?.pages ?? {})[0];
    const image = page?.imageinfo?.[0];
    return image ? (image.width && image.width > 1920 ? image.thumburl : image.url) ?? null : null;
  } catch {
    return null;
  }
}

export async function getWikipediaPhoto(...titles: string[]): Promise<PlaceImage | null> {
  for (const lang of ["pt", "en"] as const) {
    for (const title of titles.map((value) => value.trim()).filter(Boolean)) {
      const data = await summary(lang, title);
      if (!data || data.type === "disambiguation") continue;
      const src = photoUrl(data) ?? await articlePhoto(lang, data.title ?? title);
      if (!src) continue;
      return { src, alt: data.title ?? title, credit: { name: "Wikimedia Commons", profileUrl: data.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org`, source: "Wikipedia", sourceUrl: data.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org` } };
    }
  }
  return null;
}
