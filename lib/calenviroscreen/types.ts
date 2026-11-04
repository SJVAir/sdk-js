import type { infer as zinfer } from "zod";
import type { RegionsWithinMode } from "../regions/types.ts";
import type { ces4RecordSchema, ces5RecordSchema } from "./schemas/mod.ts";

/** CalEnviroScreen 4.0 scores for one census tract */
export type CES4Record = zinfer<typeof ces4RecordSchema>;

/** CalEnviroScreen 5.0 scores for one census tract */
export type CES5Record = zinfer<typeof ces5RecordSchema>;

/** The CalEnviroScreen versions the API serves */
export type CESVersion = "4.0" | "5.0";

/** A tract's scores, by version */
export interface CESRecordByVersion {
  "4.0": CES4Record;
  "5.0": CES5Record;
}

/** The census tract boundaries CES 4.0 scores can be keyed to */
export type CES4Year = "2010" | "2020";

/** The filters for a CES 5.0 list */
export interface CES5Query {
  /** A region's id: the tracts in or touching it (see `within_mode`) */
  region_id?: string;
  /**
   * With `region_id`: `contained` keeps tracts essentially inside the region,
   * `overlaps` those with at least 1% of their area inside it. Without it,
   * every tract that touches the region.
   */
  within_mode?: RegionsWithinMode;
}

/** The filters for a CES 4.0 list */
export interface CES4Query extends CES5Query {
  /** Which census tract boundaries the scores are keyed to; the server's default is 2020 */
  year?: CES4Year;
}

/** A list's filters, by version */
export interface CESQueryByVersion {
  "4.0": CES4Query;
  "5.0": CES5Query;
}

/** A single tract's options, by version: only 4.0 takes a year */
export interface CESTractQueryByVersion {
  "4.0": { year?: CES4Year };
  "5.0": Record<string, never>;
}
