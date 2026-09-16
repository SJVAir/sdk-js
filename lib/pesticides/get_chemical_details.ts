/**
 * A utility function for getting the details of a pesticide chemical.
 *
 * @example Usage
 * ```ts
 * import { getChemicalDetails } from "@sjvair/sdk/pesticides/get_chemical_details";
 *
 * const chemical = await getChemicalDetails("z89tf");
 * console.log(chemical);
 * // Prints:
 * //  {
 * //    "id": "z89tf",
 * //    "chem_code": 1855,
 * //    "name": "GLYPHOSATE, ISOPROPYLAMINE SALT",
 * //    "cas_number": "38641-94-0",
 * //    "dtxsid": "DTXSID9032721",
 * //    "iarc_group": "2A",
 * //    "categories": [ "carcinogen" ],
 * //    "products": [ ... ],
 * //    "commodities": [ ... ]
 * //  }
 * ```
 *
 * @module
 */
import { jsonCall } from "$http";
import type { ChemicalDetailData } from "./types.ts";

/**
 * Fetch details about a pesticide chemical.
 *
 * @param chemicalId The ID of the requested chemical
 *
 * @returns A ChemicalDetailData object containing chemical details
 */
export async function getChemicalDetails(
  chemicalId: string,
): Promise<ChemicalDetailData> {
  return await jsonCall<ChemicalDetailData>(
    `pesticides/chemicals/${chemicalId}`,
  );
}
