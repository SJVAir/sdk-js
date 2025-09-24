/**
 * A collection of utililties for interacting with the SJVAir API
 *
 * @example Usage
 * ```ts
 * import {
 *   getMonitors,
 *   getMonitorsMeta,
 *   getSubscriptions,
 *   login,
 * } from "@sjvair/sdk";
 *
 * const [meta, monitors] = await Promise.all([getMonitorsMeta(), getMonitors()]);
 * const user = await login("5592835428", "Fasten1821Crumb");
 * const subscriptions = await getSubscriptions(user.api_token);
 *
 * const subscribedMonitors = subscriptions.map((sub) => ({
 *   monitor: monitors.find((m) => m.id === sub.monitor),
 *   level: meta.entryType("pm25").asIter.levels.find((lvl) =>
 *     lvl.name === sub.level
 *   ),
 * }));
 *
 * console.log(subscribedMonitors);
 * // Prints:
 * //  [
 * //    {
 * //      monitor: {
 * //        id: "qesuIWgTQgqtfGJ0rvBBlw",
 * //        name: "CCAC BAM - Los Banos",
 * //        type: "bam1022",
 * //        device: "BAM 1022",
 * //        is_active: false,
 * //        is_sjvair: true,
 * //        position: {
 * //          type: "Point",
 * //          coordinates: [ -120.84474919544685, 37.052416463371344 ]
 * //        },
 * //        last_active_limit: 5400,
 * //        location: "outside",
 * //        county: "Merced",
 * //        data_source: {
 * //          name: "Central California Asthma Collaborative",
 * //          url: "https://cencalasthma.org"
 * //        },
 * //        data_providers: [
 * //          {
 * //            name: "Central California Asthma Collaborative",
 * //            url: "https://cencalasthma.org"
 * //          }
 * //        ]
 * //      },
 * //      level: {
 * //        name: "unhealthy",
 * //        label: "Unhealthy",
 * //        color: "#ff0000",
 * //        range: [ 55.5, 150.4 ],
 * //        guidance: "Everyone should reduce prolonged or heavy exertion."
 * //      }
 * //    },
 * //    {
 * //      monitor: {
 * //        id: "xgXCRh68SdG5FOdbUXvR6Q",
 * //        name: "ucm-1ed",
 * //        type: "purpleair",
 * //        device: "PA-II",
 * //        is_active: true,
 * //        is_sjvair: true,
 * //        position: { type: "Point", coordinates: [ -119.8551, 36.81932 ] },
 * //        last_active_limit: 3600,
 * //        location: "outside",
 * //        county: "Fresno",
 * //        data_source: { name: "PurpleAir", url: "https://www2.purpleair.com/" },
 * //        data_providers: [ { name: "PurpleAir", url: "https://www2.purpleair.com/" } ],
 * //        purple_id: 163097,
 * //        health: {
 * //          hour: "2025-09-24T22:00:00Z",
 * //          score: 2,
 * //          rpd_pairwise: 0.2663148580621908,
 * //          correlation: 0.5167875359065881,
 * //          channel_a_sanity: true,
 * //          channel_b_sanity: true,
 * //          grade: "B"
 * //        }
 * //      },
 * //      level: {
 * //        name: "unhealthy_sensitive",
 * //        label: "Unhealthy for Sensitive Groups",
 * //        color: "#ff7e00",
 * //        range: [ 35.5, 55.4 ],
 * //        guidance: "Sensitive groups should stay indoors and avoid outdoor activities."
 * //      }
 * //    }
 * //  ]
 * ```
 *
 * @module
 */
export * from "./lib/account/mod.ts";
export * from "./lib/collocation_sites/mod.ts";
export * from "$datetime";
export * from "./lib/hms_smoke/mod.ts";
export * from "./lib/monitors/mod.ts";
