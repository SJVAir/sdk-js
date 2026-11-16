/**
 * Turns the params of the pesticide map functions (notices, sections,
 * townships) into search params, the way those endpoints spell them: a bbox
 * as `w,s,e,n`, a list as repeated params, `classes: true` as `classes=1` and
 * `geometry: false` as `geometry=0`. Unset values and the request options
 * (`signal`, `init`) are left out.
 */
export function mapSearchParams(
  params: object,
): Record<string, string | Array<string>> {
  const searchParams: Record<string, string | Array<string>> = {};
  for (
    const [key, value] of Object.entries(params as Record<string, unknown>)
  ) {
    if (value === undefined || key === "signal" || key === "init") continue;
    if (key === "bbox" && Array.isArray(value)) {
      searchParams.bbox = value.join(",");
    } else if (Array.isArray(value)) {
      searchParams[key] = value.map(String);
    } else if (key === "classes" && value === true) {
      searchParams.classes = "1";
    } else if (key === "geometry" && value === false) {
      searchParams.geometry = "0";
    } else {
      searchParams[key] = String(value);
    }
  }
  return searchParams;
}
