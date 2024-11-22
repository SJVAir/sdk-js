import type { JSONSchemaType } from "ajv";
import type { MonitorEntryRequestResponse } from "../fetch_monitor_entries/mod.ts";
import { monitorEntry } from "./monitor.ts";

/** The response object return from the "/monitors/{MONItOR_ID}/entries" endpoint */
//export interface MonitorEntryRequestResponse {
//  /** The monitor entries included in the current page of results */
//  data: Array<MonitorEntry>;
//
//  /** The current page of results fetched */
//  page: number;
//
//  /** The total count of results */
//  count: number;
//
//  /** The total amount of results pages */
//  pages: number;
//
//  /** Indicates whether there is a next page of results */
//  has_next_page: boolean;
//
//  /** Indicates wether there is a previous page of results */
//  has_previous_page: boolean;
//}

export const monitorEntriesResponse: JSONSchemaType<
  MonitorEntryRequestResponse
> = {
  type: "object",
  properties: {
    count: { type: "number" },
    data: {
      type: "array",
      items: monitorEntry,
    },
    has_next_page: { type: "boolean" },
    has_previous_page: { type: "boolean" },
    page: { type: "number" },
    pages: { type: "number" },
  },
  required: [
    "count",
    "data",
    "has_next_page",
    "has_previous_page",
    "page",
    "pages",
  ],
};
