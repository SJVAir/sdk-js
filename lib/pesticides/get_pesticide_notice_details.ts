/**
 * A utility function for getting the details of a pesticide application
 * notice.
 *
 * @example Usage
 * ```ts
 * import { getPesticideNoticeDetails } from "@sjvair/sdk/pesticides/get_pesticide_notice_details";
 *
 * const notice = await getPesticideNoticeDetails("n1a2b3");
 * console.log(notice);
 * // Prints:
 * //  {
 * //    "id": "n1a2b3",
 * //    "application_id": 123456,
 * //    ... (excerpted for brevity)
 * //  }
 * ```
 *
 * @module
 */
import { jsonCall } from "$http";
import type { PesticideNoticeData } from "./types.ts";

/**
 * Fetch details about a pesticide application notice.
 *
 * @param noticeId The ID of the requested pesticide notice
 *
 * @returns A PesticideNoticeData object containing pesticide notice details
 */
export async function getPesticideNoticeDetails(
  noticeId: string,
): Promise<PesticideNoticeData> {
  return await jsonCall<PesticideNoticeData>(`pesticides/notice/${noticeId}`);
}
