/**
 * Types for the HMS metadata.
 * @module
 */
import type { Scale } from "../meta/types.ts";

/** The metadata returned from hms/meta */
export type HmsMeta = {
  /** The scales HMS smoke and fire are rated on, by id */
  scales: Record<string, Scale>;
};
