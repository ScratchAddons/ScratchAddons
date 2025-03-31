export function createToolbar(heatmapManager, config, polluteStepThread, msg) {
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
      initialText: msg("timing-show-heatmap"),
      toggledText: msg("timing-hide-heatmap"),
      toggleState: () => {
        config.showHeatmap = !config.showHeatmap;
        heatmapSlider.style.display = config.showHeatmap ? "block" : "none";
        config.showHeatmap ? heatmapManager.showHeatmapFn(heatmapSlider.value) : heatmapManager.hideHeatmapFn();
      },
    },
  ];

  for (const { initialText, toggledText, toggleState } of items) {
    const li = document.createElement("li");

    const textSpan = document.createElement("span");
    textSpan.textContent = initialText;

    li.appendChild(textSpan);

    li.addEventListener("click", () => {
      toggleState();
      textSpan.textContent = textSpan.textContent === initialText ? toggledText : initialText;
    });

    toolbar.appendChild(li);
  };

  toolbar.appendChild(heatmapSlider);

  return toolbar;
}
