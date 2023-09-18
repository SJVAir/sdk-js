import { BaseElement, Component, ElementChanges, Input } from "@tstk/web-components";
import { fetchMonitorDetails } from "@sjvair/api";
import { fetchChartData } from "./ChartData";
import { appendChart } from "./Chart";
import uPlotStyles from "uplot/dist/uPlot.min.css?inline";

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

  /**
   * Creates a new instance of ScatterPlot
   *
   * @returns A new instance of ScatterPlot
   */
  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: "open" });
  }

  /**
   * Set initial styles for ScatterPlot
   */
  protected onConnected() {
    this.style.display = "block";
    this.shadowRoot.adoptedStyleSheets = [styles];
  }

  /**
   * Initial rendering and re-renders uPlot chart when attribute values vhange
   */
  protected async onChanges(changes: ElementChanges): Promise<void> {
    const changeHappened = changes.has("detectBackground")
      || changes.has("monitorId")
      || changes.has("timestampGte")
      || changes.has("timestampLte");

    if (changeHappened) {
      const detectBackground = changes.get("detectBackground")?.newValue ?? false;
      const monitorId = changes.get("monitorId")?.newValue ?? this.monitorId;
      const timestampGte = changes.get("timestampGte")?.newValue ?? this.timestampGte;
      const timestampLte = changes.get("timestampLte")?.newValue ?? this.timestampLte;

      const container = document.createElement("div")
      const { width, height } = this.getBoundingClientRect();

      const { name, sensors} = await fetchMonitorDetails(monitorId);
      const data = await fetchChartData(sensors, {
        monitorId,
        fields: "pm25_reported",
        timestampGte,
        timestampLte
      });

      this.shadowRoot.innerHTML = "";
      this.shadowRoot.append(container);

      appendChart(container, data, {
        detectBackground,
        monitorName: name,
        sensors,
        height: height - 90,
        width
      });

    }
  }
}
