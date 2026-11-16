/**
 * A utility function for fetching the PLSS townships (6x6 blocks of MTRS
 * sections) of the pesticide-use map, with their totals, from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getPesticideTownships } from "@sjvair/sdk/pesticides/get_pesticide_townships";
 *
 * const townships = await getPesticideTownships({ year: 2023, classes: true });
 * const [first] = townships.features;
 * console.log(first.id, first.properties.lbs_chemical);
 * // Prints: MDM-T14S-R20E 48211.7
 * ```
 *
 * @module
 */
import { apiCall, type RequestOptions } from "$http";
import type { PesticideUseFilters } from "./get_pesticide_sections.ts";
import { mapSearchParams } from "./map_params.ts";
import type {
  PesticideTownshipCollection,
  PesticideUseClasses,
} from "./types.ts";

/** The parameters of a townships request, plus the usual request options */
export type PesticideTownshipsParams =
  & {
    /** Only the townships touching this box, as `[west, south, east, north]` */
    bbox?: [west: number, south: number, east: number, north: number];
    /** Only the townships touching this region (an id) */
    region?: string;
    /** Widens `region` by this many miles */
    buffer?: 0 | 1 | 3 | 5;
  }
  & PesticideUseFilters
  & RequestOptions;

/**
 * Fetch the PLSS townships, each with its pesticide-use totals, as a GeoJSON
 * FeatureCollection. Without an area it returns the whole valley's grid (a
 * few hundred townships).
 *
 * A feature's `id` is its PLSS designation (e.g. `MDM-T14S-R20E`), which is
 * permanent: it changes only if the MTRS sections are reimported under
 * different names.
 *
 * With `classes: true` the collection has `classes`, ranking every township
 * in the valley as `getPesticideSections` ranks sections: the area and
 * `county` never change them, `breaks[i]` is class i's inclusive upper bound,
 * and 0 is no data. On a 400 the server's message is at
 * `error.cause.result.body.error`.
 *
 * @param params The area, filters, plus an AbortSignal and extra fetch init.
 *
 * @returns The bare FeatureCollection (the API sends no `data` wrapper)
 */
export async function getPesticideTownships(
  params: PesticideTownshipsParams & { classes: true },
): Promise<PesticideTownshipCollection & { classes: PesticideUseClasses }>;
export async function getPesticideTownships(
  params?: PesticideTownshipsParams,
): Promise<PesticideTownshipCollection>;
export async function getPesticideTownships(
  params: PesticideTownshipsParams = {},
): Promise<PesticideTownshipCollection> {
  const { signal, init } = params;
  return await apiCall<PesticideTownshipCollection>({
    url: "pesticides/townships",
    searchParams: mapSearchParams(params),
    options: { signal, init },
  });
}
