/**
 * A utility function for fetching the MTRS sections (one square mile each)
 * of the pesticide-use map, with their totals, from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getPesticideSections } from "@sjvair/sdk/pesticides/get_pesticide_sections";
 *
 * const sections = await getPesticideSections({
 *   bbox: [-119.9, 36.7, -119.7, 36.85],
 *   year: 2023,
 *   classes: true,
 * });
 * const { breaks, colors } = sections.classes.lbs_chemical;
 * console.log(breaks.length === colors.length);
 * // Prints: true
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
  PesticideSectionCollection,
  PesticideUseClasses,
} from "./types.ts";

/** The filters the section and township maps share */
export type PesticideUseFilters = {
  /** The year, or `"all"` for every loaded year; the latest by default */
  year?: number | "all";
  /** One month, 1-12; the classes then rank that month alone */
  month?: number;
  /**
   * A second year: each feature then also has its totals for that year, as
   * `lbs_chemical_prev` and so on. A year with no data loaded is a 400.
   */
  compare?: number;
  /** A chemical, by its id (from `searchPesticides`) */
  chemical_id?: string;
  /** A product, by its id (from `searchPesticides`) */
  product_id?: string;
  /** A commodity, by its id (from `searchPesticides`) */
  commodity_id?: string;
  /** A county slug: narrows both the features and their totals */
  county?: string;
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
  /** Also send the valley-wide color classes (`classes=1`) */
  classes?: true;
  /** Leave out the outlines (`geometry=0`): every feature's `geometry` is null */
  geometry?: false;
};

/** Which sections to fetch: a box, a point and radius, a region, or a mix */
export type PesticideSectionsArea =
  | (
    & (
      | {
        /** The sections touching this box, as `[west, south, east, north]` */
        bbox: [west: number, south: number, east: number, north: number];
      }
      | {
        /** The latitude of the center (with `lng`) */
        lat: number;
        /** The longitude of the center (with `lat`) */
        lng: number;
        /** Miles around the point; 1 by default */
        radius?: 1 | 3 | 5;
      }
    )
    & {
      /** Also clip to this region (an id) */
      region?: string;
      /** Widens `region` by this many miles */
      buffer?: 0 | 1 | 3 | 5;
    }
  )
  | {
    /** The sections touching this region (an id) */
    region: string;
    /** Widens `region` by this many miles */
    buffer?: 0 | 1 | 3 | 5;
  };

/** The parameters of a sections request, plus the usual request options */
export type PesticideSectionsParams =
  & PesticideSectionsArea
  & PesticideUseFilters
  & RequestOptions;

/**
 * Fetch the MTRS sections in an area, each with its pesticide-use totals, as
 * a GeoJSON FeatureCollection.
 *
 * Every section in the area is a feature; one with no use has all-zero
 * totals. More than 2500 sections is a 400 ("bbox too large; zoom in",
 * "radius too large" or "region too large; zoom in"). On a 400 the server's
 * message is at `error.cause.result.body.error`.
 *
 * With `classes: true` the collection has `classes`: for each figure, up to 8
 * quantile breaks over every section in the valley for the year, month and
 * value filters. The area and `county` never change them, so with `county`
 * a section on the county line, counting only that county's use, can fall
 * below `min`. `breaks[i]` is
 * class i's inclusive upper bound and `colors[i]` its fill. A value of 0 is no
 * data: draw it with `getPesticidesMeta().ramp.no_data`.
 *
 * @param params The area, filters, plus an AbortSignal and extra fetch init.
 *
 * @returns The bare FeatureCollection (the API sends no `data` wrapper)
 */
export async function getPesticideSections(
  params: PesticideSectionsParams & { classes: true },
): Promise<PesticideSectionCollection & { classes: PesticideUseClasses }>;
export async function getPesticideSections(
  params: PesticideSectionsParams,
): Promise<PesticideSectionCollection>;
export async function getPesticideSections(
  params: PesticideSectionsParams,
): Promise<PesticideSectionCollection> {
  const { signal, init } = params;
  return await apiCall<PesticideSectionCollection>({
    url: "pesticides/sections",
    searchParams: mapSearchParams(params),
    options: { signal, init },
  });
}
