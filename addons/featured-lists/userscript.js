export default async function ({ addon, console }) {
  let modSplashes;
  changeRowsOrder();

  addon.self.addEventListener("disabled", function () {
    modSplashes = document.querySelectorAll(".mod-splash");
    modSplashes[0].style.display = "block"; // If user is not logged in
    modSplashes[1].style.display = "block";
  });
  addon.self.addEventListener("reenabled", changeRowsOrder);
  addon.settings.addEventListener("change", changeRowsOrder);

  async function changeRowsOrder() {
    addon.tab.waitForElement(".mod-splash").then((modSplash) => {
      // Rows are splited to 2 different elements, so order doesn't work. This code moves
      document.querySelectorAll(".mod-splash")[1]?.prepend(document.querySelectorAll(".mod-splash .box")[3]);
      document.querySelectorAll(".mod-splash")[1]?.prepend(document.querySelectorAll(".mod-splash .box")[2]);

      // Remove strange margin
      document.querySelectorAll(".mod-splash")[1].style.marginTop = "0px";

      // Create list of rowsObjects and keys
      let rowsWithIds = [];
      let rowsObjects = document.querySelectorAll("div.inner.mod-splash > .box");
      rowsObjects.forEach(function (el) {
        let rowObj = {};
        rowObj["key"] = getRowKey(el);
        rowObj["obj"] = el;
        el.style.order = "10";
        rowsWithIds.push(rowObj);
      });

      // Change style to grid
      modSplashes = document.querySelectorAll(".mod-splash");
      modSplashes[0].style.display = "grid"; // If user is not logged in
      modSplashes[1].style.display = "grid";
      
      console.log(rowsWithIds)

      // Change order of rows
      let rowsSetting = addon.settings.get("rows");
      console.log(rowsSetting)
      rowsSetting.forEach((item, i) => {
        let specificRow = rowsWithIds.find((e) => e.key == item.id)?.obj;
        if (specificRow) {
          if (!item.rowVisibility) specificRow.style.display = "none";
          specificRow.style.order = i;
        }
      });
    });
  }

  function getRowKey(row) {
    for (let key in row) {
      if (key.startsWith("__reactInternalInstance")) return row[key].return.key;
    }
    return null;
  }
}
