/**
 * A utility function to fetch schools and child care sites as GeoJSON points
 * from the SJVAir API, for drawing on a map.
 *
 * @example Usage
 * ```ts
 * import { getPesticideLocations } from "@sjvair/sdk/pesticides/get_pesticide_locations";
 *
 * const { features } = await getPesticideLocations({
 *   bbox: [-119.9, 36.7, -119.7, 36.85],
 *   type: ["public_school", "child_care"],
 * });
 * console.log(features[0].properties.name, features[0].geometry.coordinates);
 *
 * // With no area: every child care site in the valley.
 * const valley = await getPesticideLocations({ type: "child_care" });
 * console.log(valley.features.length);
 * ```
 *
 * @module
 */
import { apiCall, type RequestOptions } from "$http";
import type { LocationType } from "../regions/types.ts";
import type { PesticideLocationCollection } from "./types.ts";

/** Every area key, none of them set: the base each area form overrides */
type NoArea = {
  bbox?: never;
  region?: never;
  buffer?: never;
  lat?: never;
  lng?: never;
  radius?: never;
};

/**
 * The area to list locations in: a bounding box (at most 12 degrees a side),
 * a region, a point and radius, or no area at all (the whole valley). Each
 * form rules out the others' keys, so only one area is sent.
 */
export type PesticideLocationsArea =
  /** No area: every location in the valley */
  | NoArea
  | (Omit<NoArea, "bbox"> & {
    /** The box to list, as `[west, south, east, north]` degrees */
    bbox: [west: number, south: number, east: number, north: number];
  })
  | (Omit<NoArea, "region" | "buffer"> & {
    /** The ID (sqid) of a region; every location inside it is returned */
    region: string;
    /** Widens the region by this many miles */
    buffer?: 0 | 1 | 3 | 5;
  })
  | (Omit<NoArea, "lat" | "lng" | "radius"> & {
    /** Latitude of the center point */
    lat: number;
    /** Longitude of the center point */
    lng: number;
    /** The radius in miles, above 0 and up to 10 (the server defaults to 1) */
    radius?: number;
  });

/** The parameters of a locations request, plus the usual request options */
export type PesticideLocationsParams =
  & PesticideLocationsArea
  & {
    /** Limits the result to one location type, or several */
    type?: LocationType | Array<LocationType>;
    /** Keeps only locations in this county (a county slug) */
    county?: string;
  }
  & RequestOptions;

/**
 * Fetch the schools and child care sites in an area as a GeoJSON
 * FeatureCollection of points. Give a `bbox`, a `region`, or a `lat` and `lng`,
 * or no area for every site in the valley (about 2,800 features, roughly 1.5 MB
 * uncompressed), still filtered by `type` and `county`. Prefer an area when one
 * is known. `radius` and `buffer` need the area they widen.
 *
 * The `lat`/`lng` form puts the coordinates in the request URL, so use it only
 * for public points (a school), never a person's own location.
 *
 * @param params The area (none for the whole valley), optional `type` and
 * `county` filters, plus an AbortSignal and extra fetch init.
 *
 * @returns A PesticideLocationCollection (the API answers with a bare
 * FeatureCollection, with no `data` wrapper)
 */
export async function getPesticideLocations(
  params: PesticideLocationsParams = {},
): Promise<PesticideLocationCollection> {
  const searchParams: Record<string, string> = {};
  if (params.bbox !== undefined) {
    searchParams.bbox = params.bbox.join(",");
  } else if (params.region !== undefined) {
    searchParams.region = params.region;
    if (params.buffer !== undefined) {
      searchParams.buffer = String(params.buffer);
    }
  } else if (params.lat !== undefined) {
    searchParams.lat = String(params.lat);
    searchParams.lng = String(params.lng);
    if (params.radius !== undefined) {
      searchParams.radius = String(params.radius);
    }
  }

  const types = Array.isArray(params.type)
    ? params.type.join(",")
    : params.type;
  if (types) searchParams.type = types;
  if (params.county) searchParams.county = params.county;

  const { signal, init } = params;
  return await apiCall<PesticideLocationCollection>({
    url: "pesticides/locations",
    searchParams,
    options: { signal, init },
  });
}
