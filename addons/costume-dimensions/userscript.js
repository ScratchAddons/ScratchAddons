/*
KNOWN BUGS:
  - When there isn't enough room to fit the inputs, the canvas element for the paint editor streshes
  - Try selecting a square, moving it, and then using the width/height inputs... see how it moves back to where it once was?
  - Try changing a square's size with the inputs, and then look at the dimensions of the costume in the costumes lists... It only updates if you move the sqaure.
*/
export default async function ({ addon, global, console }) {
  const redux = addon.tab.redux;
  redux.initialize();
  let selected, inputEltHeight, inputEltWidth, labelX, labelY;
  redux.addEventListener("statechanged", (e) => {
    switch (e.detail.action.type) {
      case "scratch-paint/select/CHANGE_SELECTED_ITEMS":
        if (e.detail.action.selectedItems.length !== 1) {
          if (inputEltHeight) {
            inputEltHeight.remove();
            inputEltWidth.remove();
            labelX.remove();
            labelY.remove();
          }
          inputEltHeight = inputEltWidth = selected = null;
          break;
        }
        selected = e.detail.action.selectedItems[0].bounds;
        if (!inputEltHeight) {
          const optionBar = document.querySelector("[class^=mode-tools_mode-tools]");
          labelX = document.createElement("span");
          labelX.className = "labeled-icon-button_edit-field-title_1ZoEV";
          labelX.innerHTML = "height:&nbsp;";
          optionBar.appendChild(labelX);

          inputEltWidth = document.createElement("input");
          inputEltWidth.type = "number";
          inputEltWidth.className = "input_input-form_1Y0wX input_input-small-range_3oRSG"; // TODO: CHANGE
          optionBar.appendChild(inputEltWidth);

          labelY = document.createElement("span");
          labelY.className = "labeled-icon-button_edit-field-title_1ZoEV";
          labelY.innerHTML = "&nbsp;width:&nbsp;";
          optionBar.appendChild(labelY);

          inputEltHeight = document.createElement("input");
          inputEltHeight.type = "number";
          inputEltHeight.className = "input_input-form_1Y0wX input_input-small-range_3oRSG"; // TODO: CHANGE
          optionBar.appendChild(inputEltHeight);

          inputEltWidth.oninput = inputEltHeight.oninput = (e) => {
            let newXY = redux.state.scratchPaint.selectedItems[0];
            selected.width = (+inputEltWidth.value || 1) * 2;
            selected.height = (+inputEltHeight.value || 1) * 2;
            addon.tab.redux.dispatch({
              type: "scratch-paint/select/REDRAW_SELECTION_BOX",
            });
          };
        }
        inputEltWidth.value = selected.width / 2;
        inputEltHeight.value = selected.height / 2;
        break;
    }
  });
}
