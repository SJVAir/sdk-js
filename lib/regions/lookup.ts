/**
 * Limits and helpers shared by the by-code lookups. Not part of the public API.
 *
 * @module
 */

/** The most codes the API resolves in one request */
export const LOOKUP_MAX_CODES = 100;

/**
 * Trims the codes, drops blanks and duplicates (keeping first-seen order), and
 * splits them into chunks the API resolves in one request each.
 */
export function chunkCodes(codes: Array<string>): Array<Array<string>> {
  const unique = [
    ...new Set(codes.map((code) => code.trim()).filter((code) => code)),
  ];
  const chunks: Array<Array<string>> = [];
  for (let i = 0; i < unique.length; i += LOOKUP_MAX_CODES) {
    chunks.push(unique.slice(i, i + LOOKUP_MAX_CODES));
  }
  return chunks;
}

/**
 * Fetches each chunk of codes concurrently. Any failure (including an abort)
 * rejects the whole call; the results come back in chunk order.
 */
export async function fetchChunked<T>(
  codes: Array<string>,
  fetchChunk: (chunk: Array<string>) => Promise<T>,
): Promise<Array<T>> {
  return await Promise.all(chunkCodes(codes).map(fetchChunk));
}
