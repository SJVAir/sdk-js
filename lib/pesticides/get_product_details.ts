/**
 * A utility function for getting the details of a pesticide product.
 *
 * @example Usage
 * ```ts
 * import { getProductDetails } from "@sjvair/sdk/pesticides/get_product_details";
 *
 * const product = await getProductDetails("6ezxm");
 * console.log(product);
 * // Prints:
 * //  {
 * //    "id": "6ezxm",
 * //    "prodno": 68339,
 * //    "reg_number": "19713-50005-AA",
 * //    "name": "SURF-AC 910",
 * //    "fumigant": false,
 * //    "california_restricted": false,
 * //    "chemicals": [ ... ],
 * //    "commodities": [ ... ]
 * //  }
 * ```
 *
 * @module
 */
import { jsonCall } from "$http";
import type { ProductDetailData } from "./types.ts";

/**
 * Fetch details about a pesticide product.
 *
 * @param productId The ID of the requested product
 *
 * @returns A ProductDetailData object containing product details
 */
export async function getProductDetails(
  productId: string,
): Promise<ProductDetailData> {
  return await jsonCall<ProductDetailData>(
    `pesticides/products/${productId}`,
  );
}
