export default async function ({ addon, global, console, msg }) {
  let appended = false;
  const clss = addon.tab.scratchClass;

  const inputGroup = document.createElement("div");
  const labelContainer = document.createElement("label");
  inputGroup.append(labelContainer);

  const opacityText = document.createElement("span");
  opacityText.innerText = msg("opacity");

  const opacityInput = document.createElement("input");
  opacityInput.min = 0;
  opacityInput.max = 100;
  opacityInput.type = "number";
  opacityInput.value = 100;

  labelContainer.append(opacityText, opacityInput);

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    const { action } = detail;
    console.log(action);
    switch (action.type) {
      case "scratch-paint/select/CHANGE_SELECTED_ITEMS":
        opacityInput.disabled = true;
        if (action.selectedItems.length === 0) return;
        // Scratch returns undefined for bitmapMode when in bitmap mode...
        if (action.bitmapMode !== false) return;

        opacityInput.disabled = false;

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
            opacityInput.value = 100; // Default value
          }
        }
        opacityInput.oninput = () => {
          for (const selected of action.selectedItems) {
            selected.opacity = opacityInput.value / 100;
          }
        };
        break;
    }
  });

  while (true) {
    const appendRow = await addon.tab.waitForElement("[class*=paint-editor_mod-labeled-icon-height]", {
      markAsSeen: true,
    });
    appendRow.append(inputGroup);

    // scratchClass is bad.
    const row = document.querySelector("[class*=paint-editor_mod-labeled-icon-height]");
    opacityInput.className = row.querySelector("[class^=input_input-form]").className;
    opacityText.className = row.querySelector("[class^=label_input-label]").className;
    inputGroup.className = row.querySelector("[class*=input-group_input-group]").className;
    labelContainer.className = row.querySelector("[class*=label_input-group]").className;
  }
}
