/**
 * A collection of utilities for searching and resolving regions by name.
 *
 * @example Usage
 * ```ts
 * import {
 *   lookupRegionPlace,
 *   searchRegionPlaces,
 * } from "@sjvair/sdk/regions/get_region_places";
 *
 * const matches = await searchRegionPlaces("fresno");
 * console.log(matches);
 * // Prints an array of RegionData objects ordered by similarity
 *
 * const place = await lookupRegionPlace("fresno");
 * console.log(place);
 * // Prints a single RegionData object, or null if no match was found
 * ```
 *
 * @module
 */
import { jsonCall } from "$http";
import type { RegionData, RegionType } from "./types.ts";

function getPlaceSearchParams(
  q: string,
  type?: RegionType,
): Record<string, string> {
  const searchParams: Record<string, string> = { q };

  if (type) {
    searchParams.type = type;
  }

  return searchParams;
}

/**
 * Searches regions by name, returning all high-confidence matches ordered by similarity.
 *
 * @param q The name to search for
 * @param type When provided, scopes the search to a specific region type
 *
 * @returns An array of matching regions
 */
export async function searchRegionPlaces(
  q: string,
  type?: RegionType,
): Promise<Array<RegionData>> {
  return await jsonCall<Array<RegionData>>({
    url: "regions/places/search",
    searchParams: getPlaceSearchParams(q, type),
  });
}

/**
 * Resolves a name to the single best-match region. Without a `type`, resolves to the
 * containing Place using City/CDP fallback. With a `type`, returns the top match within
 * that type directly.
 *
 * @param q The name to resolve
 * @param type When provided, scopes the lookup to a specific region type
 *
 * @returns The best-match region, or null if no match was found
 */
export async function lookupRegionPlace(
  q: string,
  type?: RegionType,
): Promise<RegionData | null> {
  return await jsonCall<RegionData | null>({
    url: "regions/places/lookup",
    searchParams: getPlaceSearchParams(q, type),
  });
}
