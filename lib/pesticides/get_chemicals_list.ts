/**
 * A utility function to retrieve pesticide chemicals from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getChemicalsList } from "@sjvair/sdk/pesticides/get_chemicals_list";
 *
 * const chemicals = await getChemicalsList({ iarc_group: "2A" });
 * console.log(chemicals);
 * // Prints:
 * //  [
 * //    {
 * //      "id": "z89tf",
 * //      "chem_code": 1855,
 * //      "name": "GLYPHOSATE, ISOPROPYLAMINE SALT",
 * //      "cas_number": "38641-94-0",
 * //      "dtxsid": "DTXSID9032721",
 * //      "iarc_group": "2A",
 * //      "categories": [ "carcinogen" ]
 * //    },
 * //    ... (more chemicals)
 * //  ]
 * ```
 *
 * @module
 */
import { paginatedApiCall } from "$http";
import type { ChemicalData, IARCGroup } from "./types.ts";
import { toSearchParams } from "./search_params.ts";

/** The filters available when listing pesticide chemicals */
export interface ChemicalsListFilters {
  /** The results page number to fetch */
  page?: number;

  /** Filter by the DPR chemical code, exact match */
  chem_code?: number;

  /** Filter by IARC carcinogenicity classification group, exact match */
  iarc_group?: IARCGroup;

  /** Filter by chemical name, case-insensitive substring match */
  name?: string;

  /** Filter by hazard category */
  category?: string;
}

/**
 * Fetches all pesticide chemicals matching the given filters.
 *
 * @param filters An object containing the desired filters
 *
 * @returns An array containing all matching chemicals.
 */
export async function getChemicalsList(
  filters: ChemicalsListFilters = {},
): Promise<Array<ChemicalData>> {
  return await paginatedApiCall<ChemicalData>({
    url: "pesticides/chemicals",
    searchParams: toSearchParams(filters),
  });
}
