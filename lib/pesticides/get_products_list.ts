/**
 * A utility function to retrieve pesticide products from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getProductsList } from "@sjvair/sdk/pesticides/get_products_list";
 *
 * const products = await getProductsList({ fumigant: true });
 * console.log(products);
 * // Prints:
 * //  [
 * //    {
 * //      "id": "6ezxm",
 * //      "prodno": 68339,
 * //      "reg_number": "19713-50005-AA",
 * //      "name": "SURF-AC 910",
 * //      "fumigant": true,
 * //      "california_restricted": false
 * //    },
 * //    ... (more products)
 * //  ]
 * ```
 *
 * @module
 */
import { paginatedApiCall } from "$http";
import type { ProductData } from "./types.ts";
import { toSearchParams } from "./search_params.ts";

/** The filters available when listing pesticide products */
export interface ProductsListFilters {
  /** The results page number to fetch */
  page?: number;

  /** Filter by whether the product is a fumigant */
  fumigant?: boolean;

  /** Filter by whether the product is restricted for use in California */
  california_restricted?: boolean;

  /** Filter by product name, case-insensitive substring match */
  name?: string;
}

/**
 * Fetches all pesticide products matching the given filters.
 *
 * @param filters An object containing the desired filters
 *
 * @returns An array containing all matching products.
 */
export async function getProductsList(
  filters: ProductsListFilters = {},
): Promise<Array<ProductData>> {
  return await paginatedApiCall<ProductData>({
    url: "pesticides/products",
    searchParams: toSearchParams(filters),
  });
}
