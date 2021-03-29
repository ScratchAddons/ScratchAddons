export default async function ({ addon, global, console }) {
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "scratch-gui/monitors/UPDATE_MONITORS") {
      updateListItems();
    }
  });
}
function updateListItems() {
  for (const list of document.querySelectorAll(".ReactVirtualized__Grid__innerScrollContainer")) {
    list.style.height = "100%";
    list.style.maxHeight = "fit-content";
    list.style.overflowY = "auto";

    let prevHeight = (totalHeight = 0);
    for (const row of list.querySelectorAll("[class*='monitor_list-row']")) {
      row.style.height = "fit-content";
      row.style.top = totalHeight + prevHeight + "px";
      row.querySelector("[class*='monitor_list-value']").style.height = "fit-content";
      totalHeight += prevHeight;
      prevHeight = row.clientHeight;
    }
  }
  for (const value of document.querySelectorAll("[class*='monitor_value-inner']")) {
    value.style.height = "fit-content";
    value.style.wordBreak = "break-all";
    value.style.whiteSpace = "normal";
  }
}
