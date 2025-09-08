import type { infer as zinfer } from "zod";
import type { userDetailsSchema } from "./schema.ts";

export type UserDetails = zinfer<typeof userDetailsSchema>;
