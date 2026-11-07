/**
 * A utility function for fetching pesticide use for a region or monitor.
 *
 * @example Usage
 * ```ts
 * import { getPesticidesForPlace } from "@sjvair/sdk/pesticides/get_pesticides_for_place";
 *
 * const use = await getPesticidesForPlace(
 *   { region: { type: "county", external_id: "06019" } },
 *   { year__gte: 2022 },
 * );
 * console.log(use.years[0]);
 * // Prints: { year: 2022, pounds: 23490784.8, acres: 13379845.9, applications: 318894,
 * //   undated: { pounds: 0, acres: 0, applications: 0 } }
 * ```
 *
 * @example A saved filter whose chemical is gone
 * ```ts
 * import {
 *   getPesticidesForPlace,
 *   pesticidePlaceFilterErrors,
 * } from "@sjvair/sdk/pesticides/get_pesticides_for_place";
 *
 * try {
 *   await getPesticidesForPlace(
 *     { region: { type: "county", external_id: "06019" } },
 *     { chemical: "gs65e" },
 *   );
 * } catch (error) {
 *   const errors = pesticidePlaceFilterErrors(error);
 *   if (errors?.chemical === "not_found") {
 *     // The id is well formed but no chemical has it any more: show the
 *     // filter as retired.
 *   }
 * }
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import { type PlaceRef, placeSearchParams } from "../meta/place.ts";
import type { PesticidesForPlace, PesticidesForPlaceFilters } from "./types.ts";

/**
 * Fetches monthly and yearly pesticide use for a place.
 *
 * @param place A region by type and official code, or a monitor by id.
 * Land-use regions can't be looked up by code.
 * @param filters Narrow by chemical, commodity or product (by id, not CDPR
 * code), categories, a narrowing, IARC group, application method, or a year
 * range (1900 to 2100). Unset filters are not sent.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The place, use by month (only months with use) and use by year
 * (totals include records with no application date, shown in `undated`).
 */
export async function getPesticidesForPlace(
  place: PlaceRef,
  filters: PesticidesForPlaceFilters = {},
  options?: RequestOptions,
): Promise<PesticidesForPlace> {
  const searchParams: Record<string, string | Array<string>> =
    placeSearchParams(place);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    searchParams[key] = Array.isArray(value) ? [...value] : String(value);
  }

  return await jsonCall<PesticidesForPlace>({
    url: "pesticides/place",
    searchParams,
    options,
  });
}

/**
 * The first error code the server gave for each rejected place filter.
 * `invalid` means the value isn't valid at all (for an id: not one of our ids,
 * such as a CDPR code or a typo). `not_found` means a well-formed id that no
 * row has any more. The year bounds report Django's `min_value` / `max_value`.
 */
export type PesticidePlaceFilterErrors = {
  chemical?: "invalid" | "not_found";
  commodity?: "invalid" | "not_found";
  product?: "invalid" | "not_found";
  category?: "invalid";
  narrow?: "invalid";
  iarc_group?: "invalid";
  aerial_ground?: "invalid";
  year__gte?: "invalid" | "min_value" | "max_value";
  year__lte?: "invalid" | "min_value" | "max_value";
};

const PLACE_FILTER_FIELDS: ReadonlyArray<keyof PesticidePlaceFilterErrors> = [
  "chemical",
  "commodity",
  "product",
  "category",
  "narrow",
  "iarc_group",
  "aerial_ground",
  "year__gte",
  "year__lte",
];

/**
 * Reads the filter error codes from a failed `getPesticidesForPlace` call.
 *
 * @param error What the call rejected with.
 *
 * @returns The first code for each place filter the server rejected, or
 * `undefined` when the error isn't a 400 naming at least one of them (a
 * network failure, an abort, an unknown place, and so on).
 */
export function pesticidePlaceFilterErrors(
  error: unknown,
): PesticidePlaceFilterErrors | undefined {
  if (!(error instanceof Error)) return undefined;
  const cause = error.cause as
    | { result?: { status?: unknown }; details?: unknown }
    | undefined;
  if (cause?.result?.status !== 400) return undefined;
  const details = cause.details;
  if (typeof details !== "object" || details === null) return undefined;

  const errors: Record<string, string> = {};
  for (const field of PLACE_FILTER_FIELDS) {
    const issues = (details as Record<string, unknown>)[field];
    const code = Array.isArray(issues) ? issues[0]?.code : undefined;
    if (typeof code === "string") errors[field] = code;
  }
  return Object.keys(errors).length > 0
    ? errors as PesticidePlaceFilterErrors
    : undefined;
}
