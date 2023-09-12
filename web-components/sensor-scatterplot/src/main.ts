import { BaseElement, Component, ElementChanges, Input, Query } from "@tstk/web-components";
import { fetchMonitorDetails } from "@sjvair/api";
import { fetchChartData } from "./ChartData";
import { appendChart } from "./Chart";
import "uplot/dist/uPlot.min.css";

/**
 * A web component for generating scatterplot graphs with monitor sensor data
 */
@Component("scatter-plot")
export class Scatterplot extends BaseElement {
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

  /**
   * The target container for the uPlot graph
   */
  @Query("#chartContainer")
  container!: HTMLDivElement;

  /**
   * The component template
   */
  get template() {
    return `<div id="chartContainer"></div>`;
  }

  /**
   * Initial rendering and re-renders uPlot chart when attribute values vhange
   */
  protected async onChanges(changes: ElementChanges): Promise<void> {
    if (changes.has("monitorId") || changes.has("timestampGte") || changes.has("timestampLte")) {
      const monitorId = changes.get("monitorId")?.newValue ?? this.monitorId;
      const timestampGte = changes.get("timestampGte")?.newValue ?? this.timestampGte;
      const timestampLte = changes.get("timestampLte")?.newValue ?? this.timestampLte;

      const { name, sensors} = await fetchMonitorDetails(monitorId);
      const data = await fetchChartData(sensors, {
        monitorId,
        fields: "pm25_reported",
        timestampGte,
        timestampLte
      });

      this.container.innerHTML = "";
      appendChart(this.container, data, {
        monitorName: name,
        sensors,
        height: 300,
        width: 500
      });
    }
  }
}
