/**
 * Converts a filters object into the string-valued search params expected by
 * the HTTP layer, dropping any keys whose value is undefined.
 */
export function toSearchParams(filters: object): Record<string, string> {
  const searchParams: Record<string, string> = {};

  for (
    const [key, value] of Object.entries(filters) as Array<
      [string, string | number | boolean | undefined]
    >
  ) {
    if (value !== undefined) {
      searchParams[key] = String(value);
    }
  }

  return searchParams;
}
