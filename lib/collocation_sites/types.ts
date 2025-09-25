/**
 * Types for collocation site relationships
 * @module
 */
import type { infer as zinfer } from "zod";
import type { collocationSchema } from "./schema.ts";

/**
 * The data structure describing colocation site relationships
 */
export type CollocationSite = zinfer<typeof collocationSchema>;
