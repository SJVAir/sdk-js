/**
 * A utility function to search pesticide chemicals, products and commodities
 * by name, one page at a time.
 *
 * @example Usage
 * ```ts
 * import { searchPesticides } from "@sjvair/sdk/pesticides/search_pesticides";
 *
 * const { results, more } = await searchPesticides({
 *   type: "chemical",
 *   q: "sulf",
 *   county: "fresno",
 * });
 * console.log(results[0], more);
 * // Prints: { id: "gs65e", name: "Sulfur", detail: "CDPR chem code 560", placeholder: false } true
 * ```
 *
 * @module
 */
import { apiCall, type RequestOptions } from "$http";
import type {
  PesticideNarrow,
  PesticideSearchResult,
  PesticideSearchType,
} from "./types.ts";

/** The fewest characters (after trimming) a search needs before it is sent */
const MIN_QUERY_LENGTH = 2;

/** The parameters of a pesticide search, plus the usual request options */
export type PesticideSearchParams<T extends PesticideSearchType> = {
  /** What to search: chemicals, products or commodities */
  type: T;
  /** The text to search for: a name, or a CDPR code or CAS number */
  q: string;
  /** How many results to return; the server defaults to 10 and caps it at 25 */
  limit?: number;
  /** Only names with reported use in this year, or `"all"` for any year */
  year?: number | "all";
  /** Only names with reported use in this county, by its slug */
  county?: string;
  /** Only names this narrowing keeps */
  narrow?: PesticideNarrow;
} & RequestOptions;

/**
 * Searches the chemicals, products or commodities that appear in the use data,
 * best matches first. One page only: `more` says whether matches were left
 * out. Each result's `id` is what `getPesticidesForPlace` takes.
 *
 * @param params The type and query, optional `limit`, `year`, `county` and
 * `narrow`, plus an AbortSignal and extra fetch init.
 *
 * @returns The matches as `results`, and `more`. A query under 2 characters
 * (after trimming) returns an empty result without a request.
 */
export async function searchPesticides<T extends PesticideSearchType>(
  params: PesticideSearchParams<T>,
): Promise<PesticideSearchResult<T>> {
  const { type, q: rawQuery, limit, year, county, narrow, ...options } = params;
  const q = rawQuery.trim();
  if (q.length < MIN_QUERY_LENGTH) return { results: [], more: false };

  const searchParams: Record<string, string> = { type, q };
  if (limit !== undefined) searchParams.limit = String(limit);
  if (year !== undefined) searchParams.year = String(year);
  if (county !== undefined) searchParams.county = county;
  if (narrow !== undefined) searchParams.narrow = narrow;

  // The server answers { results, more } with no `data` envelope.
  return await apiCall<PesticideSearchResult<T>>({
    url: "pesticides/search",
    searchParams,
    options,
  });
}
