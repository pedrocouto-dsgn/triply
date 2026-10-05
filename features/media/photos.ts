import type { PlaceImage } from "./types";
import { getPlacePhoto } from "./unsplash";
import { getWikipediaPhoto } from "./wikipedia";

/** Automatic place photo: Unsplash when a key is configured, otherwise Wikipedia (no key needed). */
export async function findPlacePhoto(place: string, country?: string): Promise<PlaceImage | null> {
  if (process.env.UNSPLASH_ACCESS_KEY) {
    const photo = await getPlacePhoto(country ? `${place} ${country}` : place);
    if (photo) return photo;
  }
  return getWikipediaPhoto(place, country ? `${place}, ${country}` : "");
}
