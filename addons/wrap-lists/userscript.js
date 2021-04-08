export default async function ({ addon, global, console }) {
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "scratch-gui/monitors/UPDATE_MONITORS") {
      updateListItems();
    }
  });
  while (true) {
    const list = await addon.tab.waitForElement(".ReactVirtualized__Grid__innerScrollContainer", {
      markAsSeen: true,
    });
    updateListItems();
    new MutationObserver(updateListItems).observe(list, { attributes: true, attributeFilter: ["style"] });
  }
}
function updateListItems() {
  for (const list of document.querySelectorAll(".ReactVirtualized__Grid__innerScrollContainer")) {
    // The addon breaks when these are ported to a userstyle.
    // Maybe because JS is faster than CSS.
    list.style.height = "100%";
    list.style.maxHeight = "fit-content";
    list.style.overflowY = "auto";

    let prevHeight = 0;
    let totalHeight = 0;
    for (const row of list.querySelectorAll("[class*='monitor_list-row']")) {
      row.style.height = "fit-content";
      row.style.top = totalHeight + prevHeight + "px";
      row.querySelector("[class*='monitor_list-value']").style.height = "fit-content";
      totalHeight += prevHeight;
      prevHeight = row.clientHeight;
    }
  }
}
