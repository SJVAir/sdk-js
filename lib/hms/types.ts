/**
 * Types for the HMS metadata.
 * @module
 */
import type { infer as zinfer } from "zod";
import type { hmsMetaSchema } from "./schemas/mod.ts";

/** The metadata returned from hms/meta */
export type HmsMeta = zinfer<typeof hmsMetaSchema>;
