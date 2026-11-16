/**
 * A utility function for fetching the spray notices (SprayDays notices of
 * intent) the pesticide map shows, from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getActivePesticideNotices } from "@sjvair/sdk/pesticides/get_active_pesticide_notices";
 *
 * const notices = await getActivePesticideNotices({
 *   date: "2026-11-14",
 *   bbox: [-119.9, 36.7, -119.7, 36.85],
 *   category: ["fumigant"],
 * });
 * for (const notice of notices.features) {
 *   console.log(notice.properties.scheduled_application, notice.properties.past);
 * }
 * // Prints: 2026-11-14T07:00:00-08:00 false
 * ```
 *
 * @module
 */
import { apiCall, type RequestOptions } from "$http";
import { mapSearchParams } from "./map_params.ts";
import type {
  ActivePesticideNoticeCollection,
  ActivePesticideNoticeFeature,
  AerialGroundFilter,
  IARCGroup,
  PesticideNarrow,
} from "./types.ts";

/** The parameters of a spray notices request, plus the usual request options */
export type ActivePesticideNoticesParams = {
  /** Only notices in this box, as `[west, south, east, north]` degrees */
  bbox?: [west: number, south: number, east: number, north: number];
  /** Only notices inside this region (an id); can be combined with `bbox` */
  region?: string;
  /** Widens `region` by this many miles */
  buffer?: 0 | 1 | 3 | 5;
  /**
   * A Pacific date, `YYYY-MM-DD`: the notices whose window covers that day
   * (scheduled from 00:00 four days before it to the end of the day). Each
   * feature then has `past`. Without it, the notices scheduled from four days
   * ago onward, with no `past`.
   */
  date?: string;
  /** A chemical, by its id (from `searchPesticides`), not its CDPR code */
  chemical_id?: string;
  /** A product, by its id (from `searchPesticides`), not its CDPR number */
  product_id?: string;
  /** Only notices in this county (a county slug) */
  county?: string;
  /** Keep only what this narrowing keeps (see `getPesticidesMeta().narrows`) */
  narrow?: PesticideNarrow;
  /** The application method; `none` keeps notices with no method given */
  aerial_ground?: AerialGroundFilter;
  /**
   * Chemical categories; a notice with a chemical in any of them matches. A
   * list is sent as repeated params.
   */
  category?: string | ReadonlyArray<string>;
  /** The chemical's IARC group */
  iarc_group?: IARCGroup;
} & RequestOptions;

/** A spray notice fetched with a `date`: `past` is always present */
export type DatedPesticideNoticeFeature = ActivePesticideNoticeFeature & {
  properties: { past: boolean };
};

/** The notices fetched with a `date`, each with `past` */
export type DatedPesticideNoticeCollection =
  & Omit<ActivePesticideNoticeCollection, "features">
  & { features: Array<DatedPesticideNoticeFeature> };

/**
 * Fetch the spray notices for the map as a GeoJSON FeatureCollection of
 * points, soonest first.
 *
 * `chemical_id`, `category` and `iarc_group` together must hold on the same
 * chemical of a notice. More than 2000 matches is a 400 ("bbox too large;
 * zoom in"): narrow the request with a bbox or a filter. On a 400 the server's
 * message is at `error.cause.result.body.error`, e.g. "date must be
 * YYYY-MM-DD" or "Unknown category: foo.".
 *
 * @param params The area, `date` and filters, plus an AbortSignal and extra
 * fetch init.
 *
 * @returns The bare FeatureCollection (the API sends no `data` wrapper)
 */
export async function getActivePesticideNotices(
  params: ActivePesticideNoticesParams & { date: string },
): Promise<DatedPesticideNoticeCollection>;
export async function getActivePesticideNotices(
  params?: ActivePesticideNoticesParams,
): Promise<ActivePesticideNoticeCollection>;
export async function getActivePesticideNotices(
  params: ActivePesticideNoticesParams = {},
): Promise<ActivePesticideNoticeCollection> {
  const { signal, init } = params;
  return await apiCall<ActivePesticideNoticeCollection>({
    url: "pesticides/notices/active",
    searchParams: mapSearchParams(params),
    options: { signal, init },
  });
}
