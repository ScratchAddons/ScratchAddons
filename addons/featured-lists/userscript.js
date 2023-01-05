export default async function ({ addon, console }) {
  let modSplashes = document.querySelectorAll(".mod-splash");
  changeRowsOrder();

  addon.self.addEventListener("disabled", function () {
    modSplashes[addon.auth.fetchIsLoggedIn() ? 1 : 0].style.display = "block";
  });
  addon.self.addEventListener("reenabled", changeRowsOrder);
  addon.settings.addEventListener("change", changeRowsOrder);
  addon.auth.addEventListener("change", changeRowsOrder);

  async function changeRowsOrder() {
    addon.tab.waitForElement(".mod-splash").then(async function () {
      modSplashes = document.querySelectorAll(".mod-splash");
      
      let loggedIndex = await addon.auth.fetchIsLoggedIn() ? 2 : 0;
      console.log(loggedIndex)
      modSplashes[1].appendChild(document.querySelectorAll(".mod-splash .box")[loggedIndex]);
      modSplashes[1].appendChild(document.querySelectorAll(".mod-splash .box")[loggedIndex]);

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
      modSplashes[0].style.display = "grid"; // If user is not logged in
      modSplashes[1].style.display = "grid";

      // Change order of rows
      let rowsSetting = addon.settings.get("rows");
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
