// export default async function ({ addon, global, console }) {
//   const redux = addon.tab.redux
//   redux.initialize();
//   let selected, inputEltX, inputEltY, labelX, labelY;
//   redux.addEventListener("statechanged", (e) => {
//     //console.log("new action!", e.detail.action);
//     switch (e.detail.action.type) {
//       case "scratch-paint/select/CHANGE_SELECTED_ITEMS":
//         if (e.detail.action.selectedItems.length !== 1) {
//           if (inputEltX) {
//             inputEltX.remove();
//             inputEltY.remove();
//             labelX.remove();
//             labelY.remove();
//           }
//           inputEltX = inputEltY = selected = null;
//           break;
//         }
//         selected = e.detail.action.selectedItems[0].bounds;
//         if (!inputEltX) {
//           const optionBar = document.querySelector("[class^=mode-tools_mode-tools]");
//           labelX = document.createElement("span");
//           labelX.className = "labeled-icon-button_edit-field-title_1ZoEV";
//           labelX.innerHTML = "height:&nbsp;";
//           optionBar.appendChild(labelX);
//
//           inputEltX = document.createElement("input");
//           inputEltX.type = "number";
//           inputEltX.className = "input_input-form_1Y0wX input_input-small-range_3oRSG"; // TODO: CHANGE
//           optionBar.appendChild(inputEltX);
//
//           labelY = document.createElement("span");
//           labelY.className = "labeled-icon-button_edit-field-title_1ZoEV";
//           labelY.innerHTML = "&nbsp;width:&nbsp;";
//           optionBar.appendChild(labelY);
//
//           inputEltY = document.createElement("input");
//           inputEltY.type = "number";
//           inputEltY.className = "input_input-form_1Y0wX input_input-small-range_3oRSG"; // TODO: CHANGE
//           optionBar.appendChild(inputEltY);
//           inputEltY.oninput = inputEltX.oninput = (e) => {
//             let newXY = redux.state.scratchPaint.selectedItems[0];
//             // BUG: Setting to height/width makes the selected item go to it's "resting" position.
//             //selected.x = newXY.x
//             //selected.y = newXY.y
//             selected.height = +inputEltX.value || 1;
//             selected.width = +inputEltY.value || 1;
//             console.log(selected.x, selected.y);
//             addon.tab.redux.dispatch({
//               type: "scratch-paint/select/REDRAW_SELECTION_BOX"
//             });
//           }
//         }
//         inputEltX.value = selected.height;
//         inputEltY.value = selected.width
//         break;
//       case "scratch-paint/view/UPDATE_VIEW_BOUNDS":
//         // Called when selected is moved by user
//         // console.log("update view bounds?", e.detail.action);
//         // if (selected) {
//         //   let newXY =.bounds;
//         //   console.log(newXY);
//         //   selected.x = newXY.x;
//         //   selected.y = newXY.y;
//         // }
//         break;
//     }
//   });
// }
