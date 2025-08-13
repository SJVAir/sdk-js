import type { infer as zinfer } from "zod";
import type { hmsSmokeSchema } from "./schema.ts";

export type HMSSmokeGeoJSON = zinfer<typeof hmsSmokeSchema>;
