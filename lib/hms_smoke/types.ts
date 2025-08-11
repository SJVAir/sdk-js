import type { MultiPolygon } from "geojson";

export interface HMSSmokeGeoJSON {
  id: string;
  satellite: string;
  density: "light" | "medium" | "heavy";
  end: string;
  start: string;
  date: string;
  geometry: Omit<MultiPolygon, "bbox">;
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
