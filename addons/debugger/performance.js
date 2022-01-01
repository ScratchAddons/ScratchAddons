import {onPauseChanged,isPaused} from "./module.js";

export default async function createPerformanceTab ({ debug, addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  // TODO this sucks
  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/chart.min.js");
  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/chartjs-plugin-annotation.min.js");

  const tab = debug.createHeaderTab({
    text: msg('tab-performance'),
    icon: addon.self.dir + "/icons/performance.svg"
  });

  const content = document.createElement("div");
  const performanceFpsTitle = Object.assign(document.createElement("h1"), { innerText: msg("performance-framerate-title") });
  const performanceFpsChartCanvas = Object.assign(document.createElement("canvas"), {
    id: "debug-fps-chart",
    className: "logs",
  });
  const performanceCharNumPoints = 20;
  const getMaxFps = () => {
    return Math.round(1000 / vm.runtime.currentStepTime);
  };
  const performanceFpsChart = new Chart(performanceFpsChartCanvas.getContext("2d"), {
    type: "line",
    data: {
      // An array like [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
      labels: Array.from(Array(performanceCharNumPoints).keys()).reverse(),
      datasets: [
        {
          data: Array(performanceCharNumPoints).fill(-1),
          borderWidth: 1,
          fill: true,
          backgroundColor: "hsla(163, 85%, 40%, 0.5)",
        },
      ],
    },
    options: {
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
  const performanceClonesTitle = Object.assign(document.createElement("h1"), { innerText: msg("performance-clonecount-title") });
  const performanceClonesChartCanvas = Object.assign(document.createElement("canvas"), {
    id: "debug-fps-chart",
    className: "logs",
  });
  const performanceClonesChart = new Chart(performanceClonesChartCanvas.getContext("2d"), {
    type: "line",
    data: {
      labels: Array.from(Array(performanceCharNumPoints).keys()).reverse(),
      datasets: [
        {
          data: Array(performanceCharNumPoints).fill(-1),
          borderWidth: 1,
          fill: true,
          backgroundColor: "hsla(163, 85%, 40%, 0.5)",
        },
      ],
    },
    options: {
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
  var lastFpsTime = Date.now() + 3000;

  const ogDraw = vm.runtime.renderer.draw;
  vm.runtime.renderer.draw = function (...args) {
    if (!isPaused()) {
      const now = Date.now();
      const maxFps = getMaxFps();
      // Remove all frame times older than 1 second in renderTimes
      while (renderTimes.length > 0 && renderTimes[0] <= now - 1000) renderTimes.shift();
      renderTimes.push(now);

      if (now - lastFpsTime > 1000) {
        lastFpsTime = now;

        // Update the graphs

        const fpsData = performanceFpsChart.data.datasets[0].data;
        fpsData.shift();
        fpsData.push(Math.min(renderTimes.length, maxFps));
        // Incase we switch between 30FPS and 60FPS, update the max height of the chart.
        performanceFpsChart.options.scales.y.max = maxFps;
        performanceFpsChart.update();

        const clonesData = performanceClonesChart.data.datasets[0].data;
        clonesData.shift();
        clonesData.push(vm.runtime._cloneCounter);
        performanceClonesChart.update();
      }
    }

    ogDraw.call(this, ...args)
  };

  content.append(performanceFpsTitle, performanceFpsChartCanvas, performanceClonesTitle, performanceClonesChartCanvas);

  let pauseTime = 0;
  onPauseChanged((paused) => {
    if (paused) {
      pauseTime = Date.now();
    } else {
      const dt = Date.now() - pauseTime;
      lastFpsTime += dt;
      for (var i = 0; i < renderTimes.length; i++) {
        renderTimes[i] += dt;
      }
    }
  });

  return {
    tab,
    content,
    buttons: []
  };
}