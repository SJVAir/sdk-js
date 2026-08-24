import * as z from "zod";

export type MonitorGradeSchema = z.ZodEnum<{
  fem: "fem";
  frm: "frm";
  lcs: "lcs";
}>;

//** The regulatory grade of a monitor's measurements */
export const monitorGradeSchema: MonitorGradeSchema = z.enum(
  ["fem", "frm", "lcs"] as const,
);
