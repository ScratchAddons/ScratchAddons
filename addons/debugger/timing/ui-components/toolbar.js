export function createToolbar(heatmapManager, config, polluteStepThread, unpollutStepThread, msg) {
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
      disabled: false,
      tooltipText: null,
      toggleState: () => {
        config.showLineByLine = !config.showLineByLine;
        if (config.showLineByLine && !config.isStepThreadPolluted) {
          polluteStepThread();
        } else if (!config.showLineByLine && config.isStepThreadPolluted) {
          unpollutStepThread();
        }
      },
    },
    {
      initialText: msg("timing-show-heatmap"),
      toggledText: msg("timing-hide-heatmap"),
      disabled: false,
      tooltipText: null,
      toggleState: () => {
        config.showHeatmap = !config.showHeatmap;
        heatmapSlider.style.display = config.showHeatmap ? "block" : "none";
        config.showHeatmap ? heatmapManager.showHeatmapFn(heatmapSlider.value) : heatmapManager.hideHeatmapFn();
      },
    },
  ];

  for (const item of items) {
    const { initialText, toggledText, toggleState } = item;
    const li = document.createElement("li");

    const textSpan = document.createElement("span");
    textSpan.textContent = initialText;
    li.appendChild(textSpan);

    li.addEventListener("click", () => {
      if (item.disabled) return;
      toggleState();
      textSpan.textContent = textSpan.textContent === initialText ? toggledText : initialText;
    });

    if (item.tooltipText) li.title = item.tooltipText;

    item.element = li;
    toolbar.appendChild(li);
  }

  toolbar.appendChild(heatmapSlider);

  const updateDisabledState = (singleStepActive) => {
    const lineByLineItem = items[0];
    lineByLineItem.disabled = singleStepActive;
    lineByLineItem.tooltipText = singleStepActive ? msg("timing-disabled-single-step") : null;
    lineByLineItem.element.classList.toggle("sa-timing-disabled", singleStepActive);
    lineByLineItem.element.title = lineByLineItem.tooltipText || "";
  };

  toolbar.updateDisabledState = updateDisabledState;
  return toolbar;
}
