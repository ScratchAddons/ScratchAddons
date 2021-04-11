export default async function ({ addon, global, console, msg }) {
  let appended = false;
  const clss = addon.tab.scratchClass;

  const labelContainer = document.createElement("label");
  labelContainer.className = clss("label_input-group");

  const opacityText = document.createElement("span");
  opacityText.className = clss("label_input-label");
  opacityText.innerText = msg("opacity");

  const opacityInput = document.createElement("input");
  opacityInput.min = 0;
  opacityInput.max = 100;
  opacityInput.type = "number";

  labelContainer.append(opacityText, opacityInput);

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    const { action } = detail;
    if (action.type === "scratch-paint/select/CHANGE_SELECTED_ITEMS") {
      if (action.selectedItems.length === 0) {
        labelContainer.style.display = "none";
      } else {
        // Scratch returns undefined for bitmapMode when in bitmap mode...
        if (action.bitmapMode !== false) return;
        labelContainer.style.display = "";
        if (!appended) {
          appended = true;
          const appendRow = document.querySelector("[class*=paint-editor_mod-mode-tools]");
          appendRow.append(labelContainer);

          // There appears to be 2 classes with the same name but with different discriminators.
          // scratchClass gives us the wrong one, so in order to get the right one, we must use an element already appended.
          opacityInput.className = document.querySelector(
            "[class*=paint-editor_mod-labeled-icon-height] input"
          ).className;
        }
        if (action.selectedItems.length === 1) {
          opacityInput.value = action.selectedItems[0].opacity * 100;
        } else {
          const values = new Set();
          for (const selected of action.selectedItems) {
            values.add(selected.opacity);
          }
          if (values.size === 1) {
            opacityInput.value = values.values().next().value * 100;
          } else {
            opacityInput.value = 0;
          }
        }
        opacityInput.oninput = () => {
          for (const selected of action.selectedItems) {
            selected.opacity = opacityInput.value / 100;
          }
        };
      }
    }
  });
}
