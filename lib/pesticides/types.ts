/**
 * Types for the pesticide chemical, commodity, product, use, notice, and
 * summary data structures.
 * @module
 */
import type { infer as zinfer } from "zod";
import type {
  aerialGroundFilterSchema,
  aerialGroundSchema,
  chemicalDetailSchema,
  chemicalSchema,
  chemicalSearchHitSchema,
  commodityDetailSchema,
  commoditySchema,
  iarcGroupSchema,
  pesticideLocationCollectionSchema,
  pesticideLocationFeatureSchema,
  pesticideLocationPropertiesSchema,
  pesticideNarrowSchema,
  pesticideNoticeSchema,
  pesticideRegionSchema,
  pesticideSearchHitSchema,
  pesticidesForPlaceSchema,
  pesticidesMetaSchema,
  pesticideSummaryResponseSchema,
  pesticideSummarySchema,
  pesticideUseSchema,
  productDetailSchema,
  productSchema,
} from "./schemas/mod.ts";

/** The application method of a pesticide use or notice record */
export type AerialGround = zinfer<typeof aerialGroundSchema>;

/**
 * An application method a filter can ask for: a record's method, or `none` for
 * records with no reported method
 */
export type AerialGroundFilter = zinfer<typeof aerialGroundFilterSchema>;

/** A pesticide narrowing: concern, restricted, fumigant or aerial */
export type PesticideNarrow = zinfer<typeof pesticideNarrowSchema>;

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

/** The properties of a school or child care site on the pesticides map */
export type PesticideLocationProperties = zinfer<
  typeof pesticideLocationPropertiesSchema
>;

/** A GeoJSON Point feature for a school or child care site */
export type PesticideLocationFeature = zinfer<
  typeof pesticideLocationFeatureSchema
>;

/** Schools and child care sites as a GeoJSON FeatureCollection of points */
export type PesticideLocationCollection = zinfer<
  typeof pesticideLocationCollectionSchema
>;

/** Monthly and yearly pesticide use for a place, as returned from pesticides/place */
export type PesticidesForPlace = zinfer<typeof pesticidesForPlaceSchema>;

/** What `searchPesticides` can search */
export type PesticideSearchType = "chemical" | "product" | "commodity";

/** One product or commodity match from pesticides/search */
export type PesticideSearchHitData = zinfer<typeof pesticideSearchHitSchema>;

/** One chemical match from pesticides/search; only chemicals carry `placeholder` */
export type ChemicalSearchHitData = zinfer<typeof chemicalSearchHitSchema>;

/** A match of the given search type */
export type PesticideSearchHit<T extends PesticideSearchType> = T extends
  "chemical" ? ChemicalSearchHitData : PesticideSearchHitData;

/** One page of pesticide search matches, and whether more were left out */
export type PesticideSearchResult<T extends PesticideSearchType> = {
  results: Array<PesticideSearchHit<T>>;
  more: boolean;
};

/** Labels and descriptions for the pesticide filters, from pesticides/meta */
export type PesticidesMeta = zinfer<typeof pesticidesMetaSchema>;

/**
 * Filters for pesticide use in a place; unset filters are not sent. The
 * chemical, commodity and product are our ids (the `id` the list endpoints
 * and `searchPesticides` return), not CDPR codes, which the server refuses.
 */
export type PesticidesForPlaceFilters = {
  /** The chemical, by its id (not its CDPR chem code) */
  chemical?: string;
  /** The commodity, by its id (not its CDPR site code) */
  commodity?: string;
  /** The product, by its id (not its CDPR product number) */
  product?: string;
  /**
   * Chemical categories; records with a chemical in any of them count. Valid
   * keys are in `getPesticidesMeta().categories`. A list is sent as repeated
   * params.
   */
  category?: string | ReadonlyArray<string>;
  /** Keep only what this narrowing keeps (see `getPesticidesMeta().narrows`) */
  narrow?: PesticideNarrow;
  /** The chemical's IARC group */
  iarc_group?: IARCGroup;
  /** The application method; `none` keeps records with no reported method */
  aerial_ground?: AerialGroundFilter;
  /** First year to include (1900 to 2100) */
  year__gte?: number;
  /** Last year to include (1900 to 2100) */
  year__lte?: number;
};
