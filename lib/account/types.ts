import type { infer as zinfer } from "zod";
import type { userDetailsSchema, userDetailsWithLangSchema } from "./schema.ts";

export type UserDetails = zinfer<typeof userDetailsSchema>;
export type UserDetailsWithLang = zinfer<typeof userDetailsWithLangSchema>;
