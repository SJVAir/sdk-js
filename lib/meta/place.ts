/**
 * The place a by-place request asks about, and how it is sent.
 *
 * @module
 */
import type { RegionType } from "../regions/types.ts";

/**
 * A place to ask about: a region by its type and official code, or a monitor
 * by id. Land-use regions have no stable codes to look up.
 */
export type PlaceRef =
  | { region: { type: Exclude<RegionType, "land_use">; external_id: string } }
  | { monitor: string };

/**
 * Turns a place into the query parameters the by-place endpoints take.
 * Throws before any request for a land-use region.
 */
export function placeSearchParams(place: PlaceRef): Record<string, string> {
  if ("monitor" in place) return { monitor: place.monitor };
  if ((place.region.type as RegionType) === "land_use") {
    throw new Error("Land-use regions can't be looked up by code");
  }
  return { region_type: place.region.type, region: place.region.external_id };
}
