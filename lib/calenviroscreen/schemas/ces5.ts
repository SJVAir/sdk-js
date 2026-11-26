import * as z from "zod";

interface CES5RecordSchema extends
  z.ZodObject<{
    /** The record's id */
    id: z.ZodString;
    /** The census tract code (the tract region's `external_id`) */
    tract: z.ZodString;
    /** The census tract boundary vintage the scores are keyed to, e.g. `"2020"` */
    census_year: z.ZodString;
    /** ZIP Code */
    zipcode: z.ZodNullable<z.ZodNumber>;
    /** Approximate Location */
    approx_loc: z.ZodNullable<z.ZodString>;
    /** County */
    county: z.ZodNullable<z.ZodString>;
    /** CalEnviroScreen Region */
    region_name: z.ZodNullable<z.ZodString>;
    /** Total Population */
    population: z.ZodNullable<z.ZodNumber>;
    /** CES Score */
    ci_score: z.ZodNullable<z.ZodNumber>;
    /** CES Score Percentile */
    ci_score_p: z.ZodNullable<z.ZodNumber>;
    /** SB535 DAC */
    dac_sb535: z.ZodNullable<z.ZodBoolean>;
    /** Why the tract is an SB535 disadvantaged community, as a label; `null` when it isn't one */
    dac_category: z.ZodNullable<z.ZodString>;
    /** Pollution Burden Score */
    pollution: z.ZodNullable<z.ZodNumber>;
    /** Pollution Burden Score (scaled) */
    pollution_s: z.ZodNullable<z.ZodNumber>;
    /** Pollution Burden Percentile */
    pollution_p: z.ZodNullable<z.ZodNumber>;
    /** Ozone */
    pol_ozone: z.ZodNullable<z.ZodNumber>;
    /** Ozone Percentile */
    pol_ozone_p: z.ZodNullable<z.ZodNumber>;
    /** PM2.5 */
    pol_pm: z.ZodNullable<z.ZodNumber>;
    /** PM2.5 Percentile */
    pol_pm_p: z.ZodNullable<z.ZodNumber>;
    /** Diesel PM */
    pol_diesel: z.ZodNullable<z.ZodNumber>;
    /** Diesel PM Percentile */
    pol_diesel_p: z.ZodNullable<z.ZodNumber>;
    /** Pesticides */
    pol_pest: z.ZodNullable<z.ZodNumber>;
    /** Pesticides Percentile */
    pol_pest_p: z.ZodNullable<z.ZodNumber>;
    /** Toxic Releases (RSEI) */
    pol_rsei_haz: z.ZodNullable<z.ZodNumber>;
    /** Toxic Releases Percentile */
    pol_rsei_haz_p: z.ZodNullable<z.ZodNumber>;
    /** Traffic */
    pol_traffic: z.ZodNullable<z.ZodNumber>;
    /** Traffic Percentile */
    pol_traffic_p: z.ZodNullable<z.ZodNumber>;
    /** Drinking Water Contaminants */
    pol_drink: z.ZodNullable<z.ZodNumber>;
    /** Drinking Water Contaminants Percentile */
    pol_drink_p: z.ZodNullable<z.ZodNumber>;
    /** Lead */
    pol_lead: z.ZodNullable<z.ZodNumber>;
    /** Lead Percentile */
    pol_lead_p: z.ZodNullable<z.ZodNumber>;
    /** Cleanup Sites */
    pol_cleanups: z.ZodNullable<z.ZodNumber>;
    /** Cleanup Sites Percentile */
    pol_cleanups_p: z.ZodNullable<z.ZodNumber>;
    /** Groundwater Threats */
    pol_gwthreats: z.ZodNullable<z.ZodNumber>;
    /** Groundwater Threats Percentile */
    pol_gwthreats_p: z.ZodNullable<z.ZodNumber>;
    /** Hazardous Waste */
    pol_haz: z.ZodNullable<z.ZodNumber>;
    /** Hazardous Waste Percentile */
    pol_haz_p: z.ZodNullable<z.ZodNumber>;
    /** Impaired Water Bodies */
    pol_iwb: z.ZodNullable<z.ZodNumber>;
    /** Impaired Water Bodies Percentile */
    pol_iwb_p: z.ZodNullable<z.ZodNumber>;
    /** Small Air Toxic Sites */
    pol_small_ats: z.ZodNullable<z.ZodNumber>;
    /** Small Air Toxic Sites Percentile */
    pol_small_ats_p: z.ZodNullable<z.ZodNumber>;
    /** Solid Waste Sites */
    pol_swis: z.ZodNullable<z.ZodNumber>;
    /** Solid Waste Sites Percentile */
    pol_swis_p: z.ZodNullable<z.ZodNumber>;
    /** Population Characteristics Score */
    popchar: z.ZodNullable<z.ZodNumber>;
    /** Population Characteristics Score (scaled) */
    popchar_s: z.ZodNullable<z.ZodNumber>;
    /** Population Characteristics Percentile */
    popchar_p: z.ZodNullable<z.ZodNumber>;
    /** Asthma */
    char_asthma: z.ZodNullable<z.ZodNumber>;
    /** Asthma Percentile */
    char_asthma_p: z.ZodNullable<z.ZodNumber>;
    /** Cardiovascular Disease */
    char_cvd: z.ZodNullable<z.ZodNumber>;
    /** Cardiovascular Disease Percentile */
    char_cvd_p: z.ZodNullable<z.ZodNumber>;
    /** Diabetes Prevalence */
    char_diabetes: z.ZodNullable<z.ZodNumber>;
    /** Diabetes Prevalence Percentile */
    char_diabetes_p: z.ZodNullable<z.ZodNumber>;
    /** Low Birth Weight */
    char_lbw: z.ZodNullable<z.ZodNumber>;
    /** Low Birth Weight Percentile */
    char_lbw_p: z.ZodNullable<z.ZodNumber>;
    /** Educational Attainment */
    char_edu: z.ZodNullable<z.ZodNumber>;
    /** Educational Attainment Percentile */
    char_edu_p: z.ZodNullable<z.ZodNumber>;
    /** Linguistic Isolation */
    char_ling: z.ZodNullable<z.ZodNumber>;
    /** Linguistic Isolation Percentile */
    char_ling_p: z.ZodNullable<z.ZodNumber>;
    /** Poverty */
    char_pov: z.ZodNullable<z.ZodNumber>;
    /** Poverty Percentile */
    char_pov_p: z.ZodNullable<z.ZodNumber>;
    /** Unemployment */
    char_unemp: z.ZodNullable<z.ZodNumber>;
    /** Unemployment Percentile */
    char_unemp_p: z.ZodNullable<z.ZodNumber>;
    /** Housing Burden */
    char_housingb: z.ZodNullable<z.ZodNumber>;
    /** Housing Burden Percentile */
    char_housingb_p: z.ZodNullable<z.ZodNumber>;
    /** Population Under 10 (%) */
    pop_under_10_pct: z.ZodNullable<z.ZodNumber>;
    /** Population 10–64 (%) */
    pop_10_64_pct: z.ZodNullable<z.ZodNumber>;
    /** Population 65+ (%) */
    pop_65_plus_pct: z.ZodNullable<z.ZodNumber>;
    /** Hispanic/Latino Population (%) */
    pop_hispanic_pct: z.ZodNullable<z.ZodNumber>;
    /** White Population (%) */
    pop_white_pct: z.ZodNullable<z.ZodNumber>;
    /** Black or African American Population (%) */
    pop_black_pct: z.ZodNullable<z.ZodNumber>;
    /** American Indian and Alaska Native Population (%) */
    pop_native_pct: z.ZodNullable<z.ZodNumber>;
    /** Asian Population (%) */
    pop_asian_pct: z.ZodNullable<z.ZodNumber>;
    /** Pacific Islander Population (%) */
    pop_pacisl_pct: z.ZodNullable<z.ZodNumber>;
    /** Other or Multiple Races Population (%) */
    pop_other_pct: z.ZodNullable<z.ZodNumber>;
  }> {}
/** CalEnviroScreen 5.0 (2026) scores for one census tract (2020 tracts). Demographics are percentages. Percentiles (`_p`) are California-wide. */
export const ces5RecordSchema: CES5RecordSchema = z.object({
  id: z.string(),
  tract: z.string(),
  census_year: z.string(),
  zipcode: z.number().nullable(),
  approx_loc: z.string().nullable(),
  county: z.string().nullable(),
  region_name: z.string().nullable(),
  population: z.number().nullable(),
  ci_score: z.number().nullable(),
  ci_score_p: z.number().nullable(),
  dac_sb535: z.boolean().nullable(),
  dac_category: z.string().nullable(),
  pollution: z.number().nullable(),
  pollution_s: z.number().nullable(),
  pollution_p: z.number().nullable(),
  pol_ozone: z.number().nullable(),
  pol_ozone_p: z.number().nullable(),
  pol_pm: z.number().nullable(),
  pol_pm_p: z.number().nullable(),
  pol_diesel: z.number().nullable(),
  pol_diesel_p: z.number().nullable(),
  pol_pest: z.number().nullable(),
  pol_pest_p: z.number().nullable(),
  pol_rsei_haz: z.number().nullable(),
  pol_rsei_haz_p: z.number().nullable(),
  pol_traffic: z.number().nullable(),
  pol_traffic_p: z.number().nullable(),
  pol_drink: z.number().nullable(),
  pol_drink_p: z.number().nullable(),
  pol_lead: z.number().nullable(),
  pol_lead_p: z.number().nullable(),
  pol_cleanups: z.number().nullable(),
  pol_cleanups_p: z.number().nullable(),
  pol_gwthreats: z.number().nullable(),
  pol_gwthreats_p: z.number().nullable(),
  pol_haz: z.number().nullable(),
  pol_haz_p: z.number().nullable(),
  pol_iwb: z.number().nullable(),
  pol_iwb_p: z.number().nullable(),
  pol_small_ats: z.number().nullable(),
  pol_small_ats_p: z.number().nullable(),
  pol_swis: z.number().nullable(),
  pol_swis_p: z.number().nullable(),
  popchar: z.number().nullable(),
  popchar_s: z.number().nullable(),
  popchar_p: z.number().nullable(),
  char_asthma: z.number().nullable(),
  char_asthma_p: z.number().nullable(),
  char_cvd: z.number().nullable(),
  char_cvd_p: z.number().nullable(),
  char_diabetes: z.number().nullable(),
  char_diabetes_p: z.number().nullable(),
  char_lbw: z.number().nullable(),
  char_lbw_p: z.number().nullable(),
  char_edu: z.number().nullable(),
  char_edu_p: z.number().nullable(),
  char_ling: z.number().nullable(),
  char_ling_p: z.number().nullable(),
  char_pov: z.number().nullable(),
  char_pov_p: z.number().nullable(),
  char_unemp: z.number().nullable(),
  char_unemp_p: z.number().nullable(),
  char_housingb: z.number().nullable(),
  char_housingb_p: z.number().nullable(),
  pop_under_10_pct: z.number().nullable(),
  pop_10_64_pct: z.number().nullable(),
  pop_65_plus_pct: z.number().nullable(),
  pop_hispanic_pct: z.number().nullable(),
  pop_white_pct: z.number().nullable(),
  pop_black_pct: z.number().nullable(),
  pop_native_pct: z.number().nullable(),
  pop_asian_pct: z.number().nullable(),
  pop_pacisl_pct: z.number().nullable(),
  pop_other_pct: z.number().nullable(),
});
