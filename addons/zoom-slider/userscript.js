export default async function ({ addon, msg }) {
  const addSlider = async () => {
    if (addon.tab.editorMode !== "editor" || addon.self.disabled) {
      return;
    }

    const zoom = await addon.tab.waitForElement(".blocklyZoom");
    const blockly = await addon.tab.traps.getBlockly();

    const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    foreignObject.setAttribute("height", "500");
    foreignObject.setAttribute("width", "120");
    foreignObject.setAttribute("x", "-126");
    foreignObject.setAttribute("y", "79");
    const wrapperDiv = document.createElement("div");
    wrapperDiv.classList.add("sa-zoom-slider-wrapper");
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = blockly.mainWorkspace.options.zoomOptions.minScale;
    slider.max = blockly.mainWorkspace.options.zoomOptions.maxScale;
    slider.step = "0.01";
    slider.value = blockly.mainWorkspace.scale;
    slider.classList.add("sa-zoom-slider");
    const count = document.createElement("input");
    count.className = addon.tab.scratchClass("input_input-form", "input_input-small", {
      others: "sa-zoom-slider-count",
    });
    count.value = percentScale(blockly.mainWorkspace.scale);
    wrapperDiv.append(count, slider);
    foreignObject.append(wrapperDiv);
    zoom.append(foreignObject);

    function updateWorkspaceZoomLevel() {
      blockly.mainWorkspace.setScale(parseFloat(slider.value));
    }

    slider.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
    slider.addEventListener("input", async () => {
      count.value = percentScale(slider.value);
      updateWorkspaceZoomLevel();
    });
    count.addEventListener("change", async () => {
      const newScale = parseFloat(count.value / 100);
      const { maxScale, minScale } = blockly.mainWorkspace.options.zoomOptions;
      if (newScale > maxScale) count.value = maxScale * 100;
      if (newScale < minScale) count.value = minScale * 100;
      slider.value = count.value / 100;
      updateWorkspaceZoomLevel();
    });

    setInterval(() => {
      slider.min = blockly.mainWorkspace.options.zoomOptions.minScale;
      slider.max = blockly.mainWorkspace.options.zoomOptions.maxScale;
      if (parseFloat(slider.value) !== blockly.mainWorkspace.scale) {
        slider.value = blockly.mainWorkspace.scale;
        count.value = percentScale(slider.value);
        updateWorkspaceZoomLevel();
      }
    }, 200);

    addon.self.addEventListener("disabled", () => {
      foreignObject.remove();
    });
  };

  const percentScale = (scale) => Math.round(parseFloat(scale) * 100);

  addSlider();
  addon.tab.addEventListener("urlChange", addSlider);
  addon.self.addEventListener("reenabled", addSlider);
}
