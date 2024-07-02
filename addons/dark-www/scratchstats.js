import { textColor } from "../../libraries/common/cs/text-color.esm.js";

export default async function ({ addon, console }) {
  // Style the chart added by the scratchstats addon
  const canvas = await addon.tab.waitForElement("#sa-scratchstats-chart", { markAsSeen: true });
  await addon.tab.loadScript("/libraries/thirdparty/cs/chart.min.js");
  const updateChart = () => {
    const chart = Chart.getChart(canvas);
    if (!chart) return;
    const color = addon.self.disabled ? "#575e75" : textColor(addon.settings.get("box"));
    const lineColor = addon.self.disabled ? "rgba(0, 0, 0, 0.1)" : addon.settings.get("border");
    const options = chart.options;
    options.scales.x.ticks.color = options.scales.y.ticks.color = color;
    options.scales.x.grid.tickColor = options.scales.y.grid.tickColor = color;
    options.scales.x.grid.borderColor = options.scales.y.grid.borderColor = color;
    options.scales.x.grid.color = options.scales.y.grid.color = lineColor;
    options.plugins.title.color = color;
    chart.update();
  };
  updateChart();
  addon.settings.addEventListener("change", updateChart);
  addon.self.addEventListener("disabled", updateChart);
  addon.self.addEventListener("reenabled", updateChart);
}
