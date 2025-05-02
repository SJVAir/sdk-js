import { apiRequest } from "$http";
import { validateClosestMonitor } from "./validate_closest_monitor.ts";
import type { MonitorData } from "../types.ts";
//{
//    "data": [
//        {
//            "id": "rdgNmm5ISQKZT4nOD_ad1A",
//            "name": "CCA Root Access Hackerspace #1",
//            "device": "PA-II",
//            "is_active": true,
//            "is_sjvair": false,
//            "position": {
//                "type": "Point",
//                "coordinates": [
//                    -119.7988,
//                    36.762745
//                ]
//            },
//            "last_active_limit": 3600,
//            "location": "inside",
//            "county": "Fresno",
//            "data_source": {
//                "name": "PurpleAir",
//                "url": "https://www2.purpleair.com/"
//            },
//            "data_providers": [
//                {
//                    "name": "PurpleAir",
//                    "url": "https://www2.purpleair.com/"
//                }
//            ],
//            "distance": 14.111636121438728,
//            "purple_id": 8854
//        },
//        {
//            "id": "ZejUCY-5TKypesndJ3zvBw",
//            "name": "CCA Root Access Hackerspace #2",
//            "device": "PA-II",
//            "is_active": true,
//            "is_sjvair": false,
//            "position": {
//                "type": "Point",
//                "coordinates": [
//                    -119.798676,
//                    36.76274
//                ]
//            },
//            "last_active_limit": 3600,
//            "location": "outside",
//            "county": "Fresno",
//            "data_source": {
//                "name": "PurpleAir",
//                "url": "https://www2.purpleair.com/"
//            },
//            "data_providers": [
//                {
//                    "name": "PurpleAir",
//                    "url": "https://www2.purpleair.com/"
//                }
//            ],
//            "distance": 26.3596764878407,
//            "purple_id": 8892
//        },
//        {
//            "id": "3B9vRzPXTiCPrCHZ7ApMpA",
//            "name": "SJVAir-7BF0",
//            "device": "PA-II-FLEX",
//            "is_active": true,
//            "is_sjvair": false,
//            "position": {
//                "type": "Point",
//                "coordinates": [
//                    -119.79868,
//                    36.76302
//                ]
//            },
//            "last_active_limit": 3600,
//            "location": "outside",
//            "county": "Fresno",
//            "data_source": {
//                "name": "PurpleAir",
//                "url": "https://www2.purpleair.com/"
//            },
//            "data_providers": [
//                {
//                    "name": "PurpleAir",
//                    "url": "https://www2.purpleair.com/"
//                }
//            ],
//            "distance": 111.69634026580938,
//            "purple_id": 197641
//        }
//    ],
//    "page": 1,
//    "count": 3,
//    "pages": 1,
//    "has_next_page": false,
//    "has_previous_page": false
//}

/**
 * Fetches the closest monitors to a given set of coordinates.
 *
 * @param latitude The latitudinal coordinate of the desired location
 * @param longitude The longitudinal coordinate of the desired location
 *
 * @returns An Array containing the 3 closest monitors to a given set of coordinates.
 */
export async function fetchClosestMonitor(
  latitude: number,
  longitude: number,
): Promise<MonitorData> {
  const requestUrl = getClosestMonitorUrl(latitude, longitude);

  return await apiRequest<{ data: Array<MonitorData> }>(requestUrl)
    .then((res) => {
      const { data } = res.body;
      return validateClosestMonitorResponse(data);
    });
}
