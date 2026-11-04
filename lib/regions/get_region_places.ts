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
 *
 * const containing = await lookupRegionPlace({ lat: 36.737, lon: -119.787 });
 * // Prints the regions containing the point (RegionListItem[]); coordinates
 * // are rounded to 3 decimals and sent in a POST body
 *
 * const forMonitor = await lookupRegionPlace({
 *   monitor: "u7MaI94TT1mNy8mtdlL9uQ",
 *   type: ["zipcode", "county"],
 * });
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { RegionData, RegionListItem, RegionType } from "./types.ts";

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
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of matching regions
 */
export async function searchRegionPlaces(
  q: string,
  type?: RegionType,
  options?: RequestOptions,
): Promise<Array<RegionData>> {
  return await jsonCall<Array<RegionData>>({
    url: "regions/places/search",
    searchParams: getPlaceSearchParams(q, type),
    options,
  });
}

/** The region types a place lookup can be scoped to: one, or several. */
type PlaceLookupType = RegionType | RegionType[];

/** Looks up the regions containing a point. */
export type PointPlace = {
  lat: number;
  lon: number;
  type?: PlaceLookupType;
};

/** Looks up the regions containing a monitor. */
export type MonitorPlace = {
  monitor: string;
  type?: PlaceLookupType;
};

function joinTypes(type: PlaceLookupType): string {
  return Array.isArray(type) ? type.join(",") : type;
}

function roundCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Resolves a name to the single best-match region. Without a `type`, resolves to the
 * containing Place using City/CDP fallback. With a `type`, returns the top match within
 * that type directly.
 *
 * @param q The name to resolve
 * @param type When provided, scopes the lookup to a specific region type
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The best-match region, or null if no match was found
 */
export function lookupRegionPlace(
  q: string,
  type?: RegionType,
  options?: RequestOptions,
): Promise<RegionData | null>;
/**
 * Lists the current regions that contain a point. The coordinates are rounded
 * to 3 decimals (about 100 m) and sent in a POST body, never in the URL.
 *
 * @param place The point and, optionally, the region type(s) to return. The
 * default is every type except land use and MTRS.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The regions containing the point (no geometry)
 */
export function lookupRegionPlace(
  place: PointPlace,
  options?: RequestOptions,
): Promise<Array<RegionListItem>>;
/**
 * Lists the current regions that contain a monitor. A hidden monitor rejects
 * with a 404.
 *
 * @param place The monitor ID and, optionally, the region type(s) to return.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The regions containing the monitor (no geometry)
 */
export function lookupRegionPlace(
  place: MonitorPlace,
  options?: RequestOptions,
): Promise<Array<RegionListItem>>;
export async function lookupRegionPlace(
  first: string | PointPlace | MonitorPlace,
  second?: RegionType | RequestOptions,
  third?: RequestOptions,
): Promise<RegionData | null | Array<RegionListItem>> {
  if (typeof first === "string") {
    return await jsonCall<RegionData | null>({
      url: "regions/places/lookup",
      searchParams: getPlaceSearchParams(first, second as RegionType),
      options: third,
    });
  }

  const options = second as RequestOptions | undefined;

  if ("monitor" in first) {
    const searchParams: Record<string, string> = { monitor: first.monitor };
    if (first.type) searchParams.type = joinTypes(first.type);
    return await jsonCall<Array<RegionListItem>>({
      url: "regions/places/lookup",
      searchParams,
      options,
    });
  }

  const body: Record<string, number | string> = {
    lat: roundCoordinate(first.lat),
    lon: roundCoordinate(first.lon),
  };
  if (first.type) body.type = joinTypes(first.type);
  return await jsonCall<Array<RegionListItem>>({
    url: "regions/places/lookup",
    init: {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    options,
  });
}
