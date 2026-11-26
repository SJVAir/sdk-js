/**
 * A utility function for fetching one MTRS section's pesticide use (the
 * pesticide map's section popup) from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getPesticideSectionDetails } from "@sjvair/sdk/pesticides/get_pesticide_section_details";
 *
 * const section = await getPesticideSectionDetails("k3x9a", { year: 2023 });
 * for (const chemical of section.top_chemicals) {
 *   console.log(chemical.display_name, chemical.lbs, chemical.badges);
 * }
 * // Prints: 1,3-Dichloropropene 1100 [ "prop65", "iarc_2b" ]
 * ```
 *
 * @module
 */
import { apiCall, type RequestOptions } from "$http";
import { mapSearchParams } from "./map_params.ts";
import type {
  AerialGroundFilter,
  IARCGroup,
  PesticideNarrow,
  PesticideSectionDetail,
} from "./types.ts";

/**
 * The filters a section's details take. The value filters are the ones
 * `getPesticideSections` takes, counted the same way, so the details agree
 * with the map's shading.
 */
export type PesticideSectionDetailFilters = {
  /**
   * The year `months` and the top lists cover, or `"all"`; the latest by
   * default. A year with no data falls back to the latest rather than failing.
   */
  year?: number | "all";
  /**
   * One month, 1-12: narrows only the top lists. `years` and `months` (still
   * the year's twelve rows) are unchanged by it.
   */
  month?: number;
  /** A chemical, by its id (from `searchPesticides`) */
  chemical_id?: string;
  /** A product, by its id (from `searchPesticides`) */
  product_id?: string;
  /** A commodity, by its id (from `searchPesticides`) */
  commodity_id?: string;
  /** The application method; `none` counts records with no method given */
  aerial_ground?: AerialGroundFilter;
  /** Count only what this narrowing keeps (see `getPesticidesMeta().narrows`) */
  narrow?: PesticideNarrow;
  /**
   * Chemical categories; use of a chemical in any of them counts. A list is
   * sent as repeated params.
   */
  category?: string | ReadonlyArray<string>;
  /** The chemical's IARC group */
  iarc_group?: IARCGroup;
};

/**
 * Fetch one MTRS section: its outline, its totals by year and by month, and
 * its top chemicals (with their badge keys), products and commodities.
 * The value filters narrow `years`, `months` and the top lists; `month`
 * narrows only the top lists. With no filters the response is the unfiltered
 * section. An unknown id is a 404; a bad filter value is a 400, with the
 * server's message at `error.cause.result.body.error`.
 *
 * @param sectionId The section's id (a section feature's `id`, or a notice's
 * `section_id`)
 * @param filters The year, month and value filters
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The bare section object (the API sends no `data` wrapper)
 */
export async function getPesticideSectionDetails(
  sectionId: string,
  filters?: PesticideSectionDetailFilters,
  options?: RequestOptions,
): Promise<PesticideSectionDetail> {
  return await apiCall<PesticideSectionDetail>({
    url: `pesticides/sections/${sectionId}`,
    searchParams: mapSearchParams(filters ?? {}),
    options,
  });
}
