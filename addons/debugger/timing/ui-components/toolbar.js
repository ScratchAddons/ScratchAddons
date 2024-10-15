export function createToolbar(heatmapManager, rtcHeader, config, polluteStepThread, msg) {
  const toolbar = document.createElement("ul");
  toolbar.className = "sa-timing-toolbar sa-debugger-tabs";

  // create Heatmap slider
  const heatmapSlider = Object.assign(document.createElement("input"), {
    type: "range",
    step: "0.01",
    min: "0.0",
    max: "1.0",
    value: "1.0",
    className: "slider",
    style: "display:none",
  });
  heatmapSlider.addEventListener("input", () => heatmapManager.showHeatmapFn(heatmapSlider.value));

  const items = [
    {
      initialText: msg("timing-view-line-by-line"),
      toggledText: msg("timing-view-timers"),
      toggleState: () => {
        config.showLineByLine = !config.showLineByLine;
        if (!config.isStepThreadPolluted) polluteStepThread();
      },
    },
    {
      initialText: msg("timing-show-rtc"),
      toggledText: msg("timing-hide-rtc"),
      toggleState: () => {
        rtcHeader.style.display = rtcHeader.style.display === "none" ? "block" : "none";
        config.showRTC = !config.showRTC;
        if (!config.isStepThreadPolluted) polluteStepThread();
      },
    },
    {
      initialText: msg("timing-show-heatmap"),
      toggledText: msg("timing-hide-heatmap"),
      toggleState: () => {
        config.showHeatmap = !config.showHeatmap;
        heatmapSlider.style.display = config.showHeatmap ? "block" : "none";
        config.showHeatmap ? heatmapManager.showHeatmapFn(heatmapSlider.value) : heatmapManager.hideHeatmapFn();
      },
    },
  ];

  items.forEach(({ initialText, toggledText, toggleState }) => {
    const li = document.createElement("li");
    li.textContent = initialText;
    li.addEventListener("click", () => {
      toggleState();
      li.textContent = li.textContent === initialText ? toggledText : initialText;
    });
    toolbar.appendChild(li);
  });
  toolbar.appendChild(heatmapSlider);

  return toolbar;
}
