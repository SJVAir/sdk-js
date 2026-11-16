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
import type { PesticideNarrow, PesticideSectionDetail } from "./types.ts";

/** The filters a section's details take */
export type PesticideSectionDetailFilters = {
  /**
   * The year `months` and the top lists cover, or `"all"`; the latest by
   * default. A year with no data falls back to the latest rather than failing.
   */
  year?: number | "all";
  /** Count only what this narrowing keeps (see `getPesticidesMeta().narrows`) */
  narrow?: PesticideNarrow;
};

/**
 * Fetch one MTRS section: its outline, its totals by year and by month, and
 * its top chemicals (with their badge keys), products and commodities.
 * An unknown id is a 404.
 *
 * @param sectionId The section's id (a section feature's `id`, or a notice's
 * `section_id`)
 * @param filters The year and narrowing
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
