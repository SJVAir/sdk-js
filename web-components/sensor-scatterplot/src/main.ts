import { BaseElement, Component, ElementChanges, Input } from "@tstk/web-components";
import { fetchMonitorDetails } from "@sjvair/api";
import { fetchChartData } from "./ChartData";
import { appendChart } from "./Chart";
import uPlotStyles from "uplot/dist/uPlot.min.css?inline";
import type { uPlotConfig } from "./Chart";
import {readableColor} from "color2k";

/**
 * uPlot specific stylesheet
 */
const styles = new CSSStyleSheet();
styles.replaceSync(uPlotStyles)

/**
 * A web component for generating scatterPlot graphs with monitor sensor data
 */
@Component("scatter-plot")
export class ScatterPlot extends BaseElement {
  @Input(true)
  detectBackground!: boolean;

  /**
   * The ID of the monitor whose sensors we will graph
   */
  @Input(true)
  monitorId?: string;

  /**
   * The start time of the requested monitor sensor entry set
   */
  @Input(true)
  timestampGte?: string;

  /**
   * The end time of the requested monitor sensor entry set
   */
  @Input(true)
  timestampLte?: string;

  shadowRoot: ShadowRoot;

  /**
   * The component template
   */
  get template() {
    return `<div id="chartContainer"></div>`;
  }

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: "open" });
  }

  protected onConnected() {
    this.style.display = "block";
    this.shadowRoot.adoptedStyleSheets = [styles];
  }

  /**
   * Initial rendering and re-renders uPlot chart when attribute values vhange
   */
  protected async onChanges(changes: ElementChanges): Promise<void> {
    function getInput(name: string, defaultValue: any) {
      const inputChange = changes.get(name);
      return inputChange?.newValue ?? inputChange?.oldValue ?? defaultValue;
    }
    const changeHappened = changes.has("detectBackground")
      || changes.has("monitorId")
      || changes.has("timestampGte")
      || changes.has("timestampLte");

    if (changeHappened) {
      const detectBackground = getInput("detectBackground", false);
      const monitorId = getInput("monitorId", this.monitorId);
      const timestampGte = getInput("timestampGte", this.timestampGte);
      const timestampLte = getInput("timestampLte", this.timestampLte);

      const container = document.createElement("div")
      const { width, height } = this.getBoundingClientRect();

      const { name, sensors} = await fetchMonitorDetails(monitorId);
      const data = await fetchChartData(sensors, {
        monitorId,
        fields: "pm25_reported",
        timestampGte,
        timestampLte
      });

      const chartCfg: uPlotConfig = {
        monitorName: name,
        sensors,
        height: height - 90,
        width
      };

      if (detectBackground) {
        const color = readableColor(window.getComputedStyle(document.body).backgroundColor);
        Object.defineProperty(chartCfg, "textColor", {
          value: color
        });
        styles.replaceSync(uPlotStyles + `.u-legend { color: ${ color } }`);
      }

      this.shadowRoot.innerHTML = "";
      this.shadowRoot.append(container);
      appendChart(container, data, chartCfg);
    }
  }
}

