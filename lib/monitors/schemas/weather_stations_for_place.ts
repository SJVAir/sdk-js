import * as z from "zod";
import { placeSchema } from "../../meta/schemas/mod.ts";
import { monitorDataSchema } from "./monitor_data.ts";

interface WeatherStationSchema extends
  z.ZodObject<
    (typeof monitorDataSchema)["shape"] & {
      /** Miles from the place to the station (to 0.1); 0 when inside */
      distance: z.ZodNumber;
      /** Whether the station is inside the place */
      inside: z.ZodBoolean;
    }
  > {}
/** One weather station near a place: a monitor row plus its distance */
export const weatherStationSchema: WeatherStationSchema = monitorDataSchema
  .extend({
    distance: z.number(),
    inside: z.boolean(),
  });

interface WeatherStationsForPlaceSchema extends
  z.ZodObject<{
    /** The place asked about */
    place: typeof placeSchema;
    /** The stations inside the place, then the nearest ones, by distance */
    stations: z.ZodArray<WeatherStationSchema>;
  }> {}
/** The weather stations for a place, as returned from monitors/weather/place */
export const weatherStationsForPlaceSchema: WeatherStationsForPlaceSchema = z
  .object({
    place: placeSchema,
    stations: z.array(weatherStationSchema),
  });
