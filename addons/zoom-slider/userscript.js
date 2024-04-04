export default async function ({ addon, msg }) {
  const createSlider = ({ wrapperElement, maxScale, minScale, setScale, currentScale }) => {
    const wrapperDiv = document.createElement("div");
    wrapperDiv.classList.add("sa-zoom-slider-wrapper");
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = minScale();
    slider.max = maxScale();
    slider.step = "0.01";
    slider.value = currentScale();
    slider.classList.add("sa-zoom-slider");
    const count = document.createElement("input");
    count.className = addon.tab.scratchClass("input_input-form", "input_input-small", {
      others: "sa-zoom-slider-count",
    });
    count.value = percentScale(currentScale());
    wrapperDiv.append(count, slider);
    if (wrapperElement) wrapperElement.append(wrapperDiv);

    function updateWorkspaceZoomLevel() {
      setScale(parseFloat(slider.value));
    }

    slider.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
    slider.addEventListener("input", async () => {
      count.value = percentScale(slider.value);
      updateWorkspaceZoomLevel();
    });
    const changeListener = async () => {
      const newScale = parseFloat(count.value / 100);
      if (newScale > maxScale()) count.value = maxScale() * 100;
      if (newScale < minScale()) count.value = minScale() * 100;
      slider.value = count.value / 100;
      updateWorkspaceZoomLevel();
    };
    count.addEventListener("change", changeListener);
    count.addEventListener("blur", changeListener);

    setInterval(() => {
      slider.min = minScale();
      slider.max = maxScale();
      if (parseFloat(slider.value) !== currentScale()) {
        slider.value = currentScale();
        count.value = percentScale(slider.value);
        updateWorkspaceZoomLevel();
      }
    }, 200);

    addon.self.addEventListener("disabled", () => {
      (wrapperElement ?? wrapperDiv).remove();
    });

    return wrapperDiv;
  };

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
    zoom.append(foreignObject);
    createSlider({
      wrapperElement: foreignObject,
      maxScale: () => blockly.mainWorkspace.options.zoomOptions.maxScale,
      minScale: () => blockly.mainWorkspace.options.zoomOptions.minScale,
      setScale: (scale) => blockly.mainWorkspace.setScale(scale),
      currentScale: () => blockly.mainWorkspace.scale,
    });
  };

  const percentScale = (scale) => Math.round(parseFloat(scale) * 100);

  addSlider();
  addon.tab.addEventListener("urlChange", addSlider);
  addon.self.addEventListener("reenabled", addSlider);
}
