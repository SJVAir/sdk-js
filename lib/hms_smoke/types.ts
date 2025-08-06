import type { MultiPolygon } from "geojson";
const a: MultiPolygon = {
  coordinates: [],
  type: "MultiPolygon",
};

export interface HMSSmokeGeoJSON {
  id: string;
  satellite: string;
  density: "light" | "medium" | "heavy";
  end: string;
  start: string;
  date: string;
  geometry: MultiPolygon;
  is_final: boolean;
}

export interface HSMSmokeResponse {
  data: Array<HMSSmokeGeoJSON>;
  page: number;
  count: number;
  pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}
