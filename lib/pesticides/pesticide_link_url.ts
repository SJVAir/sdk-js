/**
 * A utility function for filling one of the Pesticides Explorer link templates
 * that `getPesticidesMeta()` serves in `links` and `link_params`.
 *
 * @example Usage
 * ```ts
 * import { getPesticidesMeta, pesticideLinkUrl } from "@sjvair/sdk/pesticides";
 *
 * const meta = await getPesticidesMeta();
 * const url = pesticideLinkUrl(meta, "section_records", "nyh2u", {
 *   year: 2023,
 *   month_start: "2023-06-01",
 *   month_end: "2023-06-30",
 *   chemical_id: "bca8f",
 * });
 * console.log(url);
 * // Prints: https://www.sjvair.com/tools/pesticides/records/?section=nyh2u&year=2023&start=2023-06-01&end=2023-06-30&chemical=bca8f
 * ```
 *
 * @module
 */
import type {
  AerialGroundFilter,
  PesticideLinkKey,
  PesticideNarrow,
  PesticidesMeta,
} from "./types.ts";

/**
 * The values that can fill an explorer link's query parameters, keyed by a
 * `link_params` entry's `from`. Leave out (or pass `undefined`, `null` or `""`
 * for) any value you don't have; its parameter is then left off.
 */
export type PesticideLinkValues = {
  /** The period's year, or `"all"` for all years */
  year?: number | "all" | null;
  /**
   * The first Pacific calendar day of a month period (`YYYY-MM-DD`). Leave it
   * off for a year period.
   */
  month_start?: string | null;
  /**
   * The last Pacific calendar day of a month period (`YYYY-MM-DD`). Leave it
   * off for a year period.
   */
  month_end?: string | null;
  /** The chemical id sent to `getPesticideSections` */
  chemical_id?: string | null;
  /** The product id sent to `getPesticideSections` */
  product_id?: string | null;
  /** The commodity id sent to `getPesticideSections` */
  commodity_id?: string | null;
  /** The application method sent to `getPesticideSections` */
  aerial_ground?: AerialGroundFilter | null;
  /** The narrowing sent to `getPesticideSections` */
  narrow?: PesticideNarrow | null;
  /** The year of the notices layer's chosen day */
  notices_year?: number | null;
  /** The month (1-12) of the notices layer's chosen day */
  notices_month?: number | null;
  /** A value for a source newer than this SDK */
  [source: string]: string | number | null | undefined;
};

/**
 * Fill an explorer link template by the server's rule: replace `{id}` with the
 * section's or chemical's id, then, for each of the link's `link_params` in
 * order whose `from` value is given, append `param=value` (with `?` when the
 * template has no query yet, `&` otherwise). The id, params and values are
 * URL-encoded.
 *
 * Which notices link to use, and a month's first and last day, are the
 * caller's to work out (see the server's `pesticides/meta/` docs).
 *
 * @param meta The `links` and `link_params` from `getPesticidesMeta()`
 * @param link Which explorer link to fill
 * @param id The section's id (a section feature's `id`) for the section links,
 * or the chemical's id for `chemical_page`
 * @param values The values the caller has, keyed by `from`
 *
 * @returns The absolute URL
 */
export function pesticideLinkUrl(
  meta: Pick<PesticidesMeta, "links" | "link_params">,
  link: PesticideLinkKey,
  id: string,
  values: PesticideLinkValues = {},
): string {
  let url = meta.links[link].replaceAll("{id}", encodeURIComponent(id));
  for (const { param, from } of meta.link_params[link]) {
    const value = values[from];
    if (value === undefined || value === null || value === "") continue;
    url += url.includes("?") ? "&" : "?";
    url += `${encodeURIComponent(param)}=${encodeURIComponent(String(value))}`;
  }
  return url;
}
