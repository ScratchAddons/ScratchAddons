import { onPauseChanged, isPaused } from "./module.js";

export default async function createPerformanceTab({ debug, addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/chart.min.js");

  // In optimized graphs everything still looks good
  const fancyGraphs = addon.settings.get("fancy_graphs");
  const lineWidth = fancyGraphs ? 1 : 2;
  const lineColor = fancyGraphs ? "hsla(163, 85%, 40%, 0.5)" : "hsla(163, 85%, 40%, 1)";

  const tab = debug.createHeaderTab({
    text: msg("tab-performance"),
    icon: addon.self.dir + "/icons/performance.svg",
  });

  const content = Object.assign(document.createElement("div"), {
    className: "sa-performance-tab-content",
  });

  const createChart = ({ title }) => {
    const titleElement = Object.assign(document.createElement("h2"), {
      textContent: title,
    });
    const canvas = Object.assign(document.createElement("canvas"), {
      className: "sa-debugger-chart",
    });
    return {
      title: titleElement,
      canvas,
    };
  };

  const now = () => performance.now();

  const getMaxFps = () => Math.round(1000 / vm.runtime.currentStepTime);

  const NUMBER_OF_POINTS = 20;
  // An array like [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  const labels = Array.from(Array(NUMBER_OF_POINTS).keys()).reverse();

  const fpsElements = createChart({
    title: msg("performance-framerate-title"),
  });
  const fpsChart = new Chart(fpsElements.canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: Array(NUMBER_OF_POINTS).fill(-1),
          borderWidth: lineWidth,
          fill: fancyGraphs,
          backgroundColor: "#29beb8",
          borderColor: lineColor,
        },
      ],
    },
    options: {
      animation: fancyGraphs,
      scales: {
        y: {
          max: getMaxFps(),
          min: 0,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => msg("performance-framerate-graph-tooltip", { fps: context.parsed.y }),
          },
        },
      },
    },
  });

  const clonesElements = createChart({
    title: msg("performance-clonecount-title"),
  });
  const performanceClonesChart = new Chart(clonesElements.canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: Array(NUMBER_OF_POINTS).fill(-1),
          borderWidth: lineWidth,
          fill: fancyGraphs,
          backgroundColor: "#29beb8",
          borderColor: lineColor,
        },
      ],
    },
    options: {
      animation: fancyGraphs,
      scales: {
        y: {
          max: 300,
          min: 0,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => msg("performance-clonecount-graph-tooltip", { clones: context.parsed.y }),
          },
        },
      },
    },
  });

  // Holds the times of each frame drawn in the last second.
  // The length of this list is effectively the FPS.
  const renderTimes = [];

  // The last time we pushed a new datapoint to the graph
  let lastFpsTime = now() + 3000;

  debug.addAfterStepCallback(() => {
    if (isPaused()) {
      return;
    }
    const time = now();

    // Remove all frame times older than 1 second in renderTimes
    while (renderTimes.length > 0 && renderTimes[0] <= time - 1000) renderTimes.shift();
    renderTimes.push(time);

    if (time - lastFpsTime > 1000) {
      lastFpsTime = time;

      const maxFps = getMaxFps();
      const fpsData = fpsChart.data.datasets[0].data;
      fpsData.shift();
      fpsData.push(Math.min(renderTimes.length, maxFps));
      // Incase we switch between 30FPS and 60FPS, update the max height of the chart.
      fpsChart.options.scales.y.max = maxFps;

      const clonesData = performanceClonesChart.data.datasets[0].data;
      clonesData.shift();
      clonesData.push(vm.runtime._cloneCounter);

      if (isVisible) {
        fpsChart.update();
        performanceClonesChart.update();
      }
    }
  });

  content.appendChild(fpsElements.title);
  content.appendChild(fpsElements.canvas);
  content.appendChild(clonesElements.title);
  content.appendChild(clonesElements.canvas);

  let pauseTime = 0;
  onPauseChanged((paused) => {
    if (paused) {
      pauseTime = now();
    } else {
      const dt = now() - pauseTime;
      lastFpsTime += dt;
      for (var i = 0; i < renderTimes.length; i++) {
        renderTimes[i] += dt;
      }
    }
  });

  let isVisible = false;
  const show = () => {
    isVisible = true;
  };
  const hide = () => {
    isVisible = false;
  };

  return {
    tab,
    content,
    buttons: [],
    show,
    hide,
  };
}
