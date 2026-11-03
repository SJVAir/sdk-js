/**
 * Types for the CalHeatScore metadata.
 * @module
 */
import type { Scale } from "../meta/types.ts";

/** The metadata returned from calheatscore/meta */
export type CalHeatScoreMeta = {
  /** The scales CalHeatScore values are rated on, by id */
  scales: Record<string, Scale>;
};
