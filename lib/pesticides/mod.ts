/**
 * A collection of utililties for interacting with the SJVAir pesticides API
 *
 * @example Usage
 * ```ts
 * import { getRegionPesticideSummary } from "@sjvair/sdk/pesticides";
 *
 * const summary = await getRegionPesticideSummary("dn3sk", { year: 2022 });
 * console.log(summary);
 * // Prints:
 * //  {
 * //    "region": { "id": "dn3sk", "name": "Tulare County", "slug": "tulare", "type": "county" },
 * //    "data": [
 * //      {
 * //        "year": 2022,
 * //        "chemical": { "id": "bca8f", "chem_code": 2254, "name": "ABAMECTIN", ... },
 * //        "commodity": { "id": "6cxb7", "site_code": "10", "name": "STRUCTURAL PEST CONTROL" },
 * //        "total_lbs": 0.0275,
 * //        "total_acres": null,
 * //        "application_count": 167
 * //      },
 * //      ... (more rows)
 * //    ],
 * //    "count": 1
 * //  }
 * ```
 *
 * @module
 */
export * from "./get_commodities_list.ts";
export * from "./get_commodity_details.ts";
export * from "./get_chemicals_list.ts";
export * from "./get_chemical_details.ts";
export * from "./get_products_list.ts";
export * from "./get_product_details.ts";
export * from "./get_pesticide_use_list.ts";
export * from "./get_pesticide_use_details.ts";
export * from "./get_pesticide_notice_list.ts";
export * from "./get_pesticide_notice_details.ts";
export * from "./get_region_pesticide_summary.ts";
export * from "./get_region_pesticide_notices.ts";
export * from "./get_region_pesticide_use.ts";
export * from "./types.ts";
