import { textColor } from "../../libraries/common/cs/text-color.esm.js";

export default async function ({ addon, console }) {
  // Style the charts in Debugger's Performance tab
  await addon.tab.loadScript("/libraries/thirdparty/cs/chart.min.js");
  const updateCharts = () => {
    for (const canvas of document.querySelectorAll(".sa-debugger-chart")) {
      const chart = Chart.getChart(canvas);
      if (!chart) return;
      const color = addon.self.disabled ? "#575e75" : textColor(addon.settings.get("accent"));
      const gridColor = addon.self.disabled
        ? "rgba(0, 0, 0, 0.1)"
        : textColor(addon.settings.get("accent"), "rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.1)");
      const options = chart.options;
      options.scales.x.ticks.color = options.scales.y.ticks.color = color;
      options.scales.x.grid.tickColor = options.scales.y.grid.tickColor = color;
      options.scales.x.grid.borderColor = options.scales.y.grid.borderColor = color;
      options.scales.x.grid.color = options.scales.y.grid.color = gridColor;
      chart.update();
    }
  };

  if (document.querySelector(".sa-debugger-chart")) updateCharts();
  window.addEventListener("saDebuggerPerformanceTabShown", updateCharts);
  addon.settings.addEventListener("change", updateCharts);
  addon.self.addEventListener("disabled", updateCharts);
  addon.self.addEventListener("reenabled", updateCharts);
}
