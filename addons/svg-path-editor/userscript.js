export default async function ({ addon, console, msg }) {
  let button;
  let lastPaintMode;

  await addon.tab.waitForElement("div.mode-tools_mode-tools_kuBCO", {  markAsSeen: true });
  addon.tab.redux.initialize()
  addon.tab.redux.addEventListener("statechanged", async function() {
    button = document.querySelector(".sa-svg-path-editor-button")
    const paintMode = addon.tab.redux.state.scratchPaint.mode;
    if (lastPaintMode !== paintMode) { if (button) { button.remove() } };
    lastPaintMode = paintMode;
    if (
      paintMode !== "SELECT" &&
      paintMode !== "RESHAPE"
    ) return;
    if (!button) {
      button = document.createElement("span")
      button.className = "button_button_LhMbA labeled-icon-button_mod-edit-field_wieqn sa-svg-path-editor-button";
      button.role = "button";

      const img = document.createElement("img");
      img.className = "labeled-icon-button_edit-field-icon_YEtkK";
      img.src = addon.self.dir + "/image.svg";
      img.alt = msg("label");
      img.title = msg("label");
      button.appendChild(img);

      const label = document.createElement("span");
      label.className = "labeled-icon-button_edit-field-title_0dBTI";
      label.textContent = msg("label");
      button.appendChild(label);

      button.addEventListener("click", async function () {
        if (button.classList.contains("button_mod-disabled_HvX8y")) return;
        const { content, closeButton, remove } = addon.tab.createModal(msg("label"), {
          isOpen: true
        })
        try {
          const pathData = addon.tab.redux.state.scratchPaint.selectedItems[0].pathData;

          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.classList.add("sa-svg-path-editor-svg");
          svg.setAttribute("height", "200px");

          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("stroke", "#009dec");
          path.setAttribute("stroke-width", "3");
          path.setAttribute("fill", "none");

          svg.appendChild(path)
          content.appendChild(svg)

          async function setPath(d) {
            path.setAttribute("d", d)
            const bbox = path.getBBox();
            svg.setAttribute("viewBox", `${bbox.x-3} ${bbox.y-3} ${bbox.width+3} ${bbox.height+3}`);
          }

          const input = document.createElement("input");
          input.className = "input_input-form_w8QAP sa-svg-path-editor-input";
          input.value = pathData;
          input.addEventListener("input", () => {
            setPath(input.value)
          });
          content.appendChild(input);

          setPath(input.value)

          const footer = document.createElement("div");
          footer.className = "action-buttons";

          const cancelButton = document.createElement("button");
          cancelButton.className = "button action-button close-button white";
          cancelButton.textContent = addon.tab.scratchMessage("general.cancel");
          cancelButton.addEventListener("click", () => {remove()});
          footer.appendChild(cancelButton);

          const saveButton = document.createElement("button");
          saveButton.className = "button action-button submit-button";
          saveButton.textContent = msg("save");
          saveButton.addEventListener("click", () => {
            addon.tab.redux.state.scratchPaint.selectedItems[0].pathData = input.value;
            remove();
          });
          footer.appendChild(saveButton);

          content.appendChild(footer)

          closeButton.addEventListener("click", () => {
            remove();
          });
        } catch (e) {
          remove()
        }
      });
      if (addon.tab.redux.state.scratchPaint.selectedItems.length !== 1) button.classList.add("button_mod-disabled_HvX8y")
      else if (!addon.tab.redux.state.scratchPaint.selectedItems[0].pathData) button.classList.add("button_mod-disabled_HvX8y")

      await addon.tab.waitForElement("div.mode-tools_mode-tools_kuBCO")
      const toolbar = document.querySelector("div.mode-tools_mode-tools_kuBCO");
      toolbar.appendChild(button);
    } else {
      if (addon.tab.redux.state.scratchPaint.selectedItems.length !== 1) button.classList.add("button_mod-disabled_HvX8y")
      else if (!addon.tab.redux.state.scratchPaint.selectedItems[0].pathData) button.classList.add("button_mod-disabled_HvX8y")
      else button.classList.remove("button_mod-disabled_HvX8y")
    }
  })
}
