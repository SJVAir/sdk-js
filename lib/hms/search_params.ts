/**
 * Maps an HMS list query to the server's search params. Not part of the
 * public API.
 *
 * @module
 */
import type { HMSBaseQuery } from "./query.ts";

/** Maps an HMS query to the server's search params. Not part of the public API. */
export function hmsSearchParams(
  query: HMSBaseQuery & { density?: string } = {},
): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.date !== undefined) params.date = query.date;
  if (query.start !== undefined) params.date__gte = query.start;
  if (query.end !== undefined) params.date__lte = query.end;
  if (query.region_id !== undefined) params.region_id = query.region_id;
  if (query.density !== undefined) params.density = query.density;
  return params;
}
