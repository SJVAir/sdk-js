/**
 * Shows a region the way its type says to, using the `name_template` from
 * `regions/meta/` (e.g. "ZIP 93702" for the ZIP code "93702").
 *
 * @example Usage
 * ```ts
 * import { getRegionsMeta, regionDisplayName } from "@sjvair/sdk/regions";
 *
 * const meta = await getRegionsMeta();
 * regionDisplayName({ type: "zipcode", name: "93702" }, meta); // "ZIP 93702"
 * regionDisplayName({ type: "city", name: "Arvin" }, meta); // "Arvin"
 * ```
 *
 * @module
 */
import type { RegionsMetaData, RegionType } from "./types.ts";

/**
 * Returns how to show a region: its type's `name_template` with `{name}`
 * replaced by the region's name, or the name itself when the type has no
 * template (or is missing from `meta`). Nothing in the name is interpreted.
 *
 * @param region Any region the SDK returns (it needs only `type` and `name`).
 * @param meta The result of `getRegionsMeta()`, or its plain data.
 * @returns The region's display name.
 */
export function regionDisplayName(
  region: { type: RegionType; name: string },
  meta: Pick<RegionsMetaData, "types">,
): string {
  const template = meta.types[region.type]?.name_template;
  return typeof template === "string"
    ? template.split("{name}").join(region.name)
    : region.name;
}
