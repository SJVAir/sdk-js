import { default as uPlot } from "uplot";
import type { AlignedData, Options, Series } from "uplot";

/**
 * Configuration options for the uPlot scatter plot
 */
interface uPlotConfig {
  /** The height of the graph */
  height: number;

  /** The width of the graph */
  width: number;

  /** An array of sensor ID's used by the monitor who's data is being charted*/
  sensors: Array<string>;

  /** The name of the monitor who's data is being charted */
  monitorName: string;
}

/**
 * Colors to use for scatter plot points
 */
const colors = ["#E1341E", "#1ECBE1", "#942CD3", "#6BD32C"];

/**
 * Create the scatter plot and append it to the provided HTML element
 *
 * @param target The HTML element in which to append the scatter plot
 * @param data The parsed monitor entry data to chart
 * @param cfg An object containing configuration options for the scatter plot
 *
 * @returns A uPlot instance
 */
export function appendChart(target: HTMLElement, data: AlignedData, cfg: uPlotConfig): uPlot {
  return new uPlot(configureOptions(cfg), data, target);
}

/**
 * Generates scatter plot options based off of the provided uPlotConfig object
 * @param cfg An object containing configuration options for the scatter plot
 *
 * @returns A uPlot options object
 */
function configureOptions(cfg: uPlotConfig): Options {
  const ySeries: Array<Series> = cfg.sensors.map((sensor, idx) => {
    const label = `Sensor ${
      (sensor.length === 1) ? sensor.toUpperCase() : sensor
    }`;
    return {
      show: true,
      spanGaps: false,
      label,
      // series style
      stroke: colors[idx],
      fill: colors[idx],
      paths: drawPoints,
    };
  });

  return {
    title: cfg.monitorName,
    id: "sensorChart",
    class: "sensor-chart",
    width: cfg.width,
    height: cfg.height,
    cursor: {
      points: {
        fill: "black"
      }
    },
    //@ts-ignore: select missing psudo "required" options
    select: {
      show: false
    },
    scales: {
      x: {
        range: guardedRange
      },
      y: {
        range: guardedRange
      }
    },
    series: [
      {},
      ...ySeries
    ],
  };
}

/**
 * A custom render function to generate small circles on a uPlot graph instead of lines
 *
 * @param A uPlot instance
 * @param seriesIdx The index of the current data series in use
 */
const drawPoints = (u: uPlot, seriesIdx: number) => {
  const size = 5 * devicePixelRatio;

  uPlot.orient(u, seriesIdx, (series, dataX, dataY, scaleX, scaleY, valToPosX, valToPosY, xOff, yOff, xDim, yDim, _, __, ___, arc) => {
    u.ctx.fillStyle = (typeof series.stroke === "function") ? series.stroke(u, seriesIdx) : series.stroke!;

    let deg360 = 2 * Math.PI;

    let p = new Path2D();

    for (let i = 0; i < dataY.length; i++) {
      let xVal = dataX[i];
      let yVal = dataY[i]!;

      if (xVal >= scaleX.min! && xVal <= scaleX.max! && yVal >= scaleY.min! && yVal <= scaleY.max!) {
        let cx = valToPosX(xVal, scaleX, xDim, xOff);
        let cy = valToPosY(yVal!, scaleY, yDim, yOff);

        p.moveTo(cx + size/2, cy);
        arc(p, cx, cy, size/2, 0, deg360);
      }
    }

    u.ctx.fill(p);
  });

  return null;
};

/**
 * Compute static ranges for a cleaner graph
 *
 * @param _ A uPlot instance (unused)
 * @param min The assumed minimum value
 * @param max The assumed max value
 *
 * @returns An array containing the computed minimum and maximum values of a series
 */
function guardedRange(_: uPlot, min: number, max: number): [number, number] {
  if (max == min) {
    if (min == null) {
      min = 0;
      max = 100;
    }
    else {
      let delta = Math.abs(max) || 100;
      max += delta;
      min -= delta;
    }
  }

  return [min, max];
}
