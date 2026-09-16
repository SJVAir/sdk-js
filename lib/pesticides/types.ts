/**
 * Types for the pesticide chemical, commodity, product, use, notice, and
 * summary data structures.
 * @module
 */
import type { infer as zinfer } from "zod";
import type {
  aerialGroundSchema,
  chemicalDetailSchema,
  chemicalSchema,
  commodityDetailSchema,
  commoditySchema,
  iarcGroupSchema,
  pesticideNoticeSchema,
  pesticideRegionSchema,
  pesticideSummaryResponseSchema,
  pesticideSummarySchema,
  pesticideUseSchema,
  productDetailSchema,
  productSchema,
} from "./schemas/mod.ts";

/** The application method of a pesticide use or notice record */
export type AerialGround = zinfer<typeof aerialGroundSchema>;

/** The IARC carcinogenicity classification group of a chemical */
export type IARCGroup = zinfer<typeof iarcGroupSchema>;

/** A minimal Region reference, as embedded in pesticide records */
export type PesticideRegionData = zinfer<typeof pesticideRegionSchema>;

/** A pesticide Chemical object returned from the SJVAir API */
export type ChemicalData = zinfer<typeof chemicalSchema>;

/** A Chemical object, including its associated products and commodities */
export type ChemicalDetailData = zinfer<typeof chemicalDetailSchema>;

/** A pesticide Commodity object returned from the SJVAir API */
export type CommodityData = zinfer<typeof commoditySchema>;

/** A Commodity object, including its associated chemicals and products */
export type CommodityDetailData = zinfer<typeof commodityDetailSchema>;

/** A pesticide Product object returned from the SJVAir API */
export type ProductData = zinfer<typeof productSchema>;

/** A Product object, including its associated chemicals and commodities */
export type ProductDetailData = zinfer<typeof productDetailSchema>;

/** A pesticide use record from California DPR's Pesticide Use Reporting (PUR) database */
export type PesticideUseData = zinfer<typeof pesticideUseSchema>;

/** A pesticide application notice from CDFA's Notice of Intent (NOI) program */
export type PesticideNoticeData = zinfer<typeof pesticideNoticeSchema>;

/** A single aggregated row of pesticide use, grouped by chemical, commodity, and year */
export type PesticideSummaryData = zinfer<typeof pesticideSummarySchema>;

/** The aggregated pesticide use summary for a region */
export type PesticideSummaryResponseData = zinfer<
  typeof pesticideSummaryResponseSchema
>;
