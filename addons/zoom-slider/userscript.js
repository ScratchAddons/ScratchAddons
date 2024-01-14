export default async function ({ addon, msg }) {
  const addSlider = async () => {
    if (addon.tab.editorMode !== "editor" || addon.self.disabled) {
      return;
    }

    const zoom = await addon.tab.waitForElement(".blocklyZoom");
    const blockly = await addon.tab.traps.getBlockly();
    window.blockly = blockly;

    const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    foreignObject.setAttribute("height", "500");
    foreignObject.setAttribute("width", "120");
    foreignObject.setAttribute("x", "-126");
    foreignObject.setAttribute("y", "95");
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
    count.classList.add("sa-zoom-slider-count");
    count.value = percentScale(blockly.mainWorkspace.scale);
    wrapperDiv.append(count, slider);
    foreignObject.append(wrapperDiv);
    zoom.append(foreignObject);

    slider.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
    slider.addEventListener("input", async () => {
      blockly.mainWorkspace.setScale(parseFloat(slider.value));
      if (!countInput) {
        count.value = percentScale(slider.value);
      }
    });
    let countInput = false;
    count.addEventListener("input", async () => (countInput = true));
    count.addEventListener("blur", async () => (countInput = false));
    count.addEventListener("change", async () => {
      slider.value = count.value / 100;
      slider.dispatchEvent(new Event("input"));
      countInput = false;
    });

    setInterval(() => {
      slider.min = blockly.mainWorkspace.options.zoomOptions.minScale;
      slider.max = blockly.mainWorkspace.options.zoomOptions.maxScale;
      slider.value = blockly.mainWorkspace.scale;
      slider.dispatchEvent(new Event("input"));
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
