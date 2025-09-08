import type { infer as zinfer } from "zod";
import type { userLoginSchema } from "./schema.ts";

export type UserLogin = zinfer<typeof userLoginSchema>;
