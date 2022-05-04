/* global $, paste */
export default async function ({ addon, console, msg }) {
  const buttons = document.querySelectorAll(".postfootright");
  buttons.forEach(function (elm) {
    const addBtn = document.createElement("li");
    const addBtnAElement = document.createElement("a");
    addBtnAElement.href = "#reply";
    addBtnAElement.textContent = msg("add-btn");
    addBtn.appendChild(addBtnAElement);
    addBtn.addEventListener("click", (e) => setTimeout(() => addIDLink(e), 0));
    addon.tab.appendToSharedSpace({ space: "forumsBeforePostReport", element: addBtn, scope: elm, order: 10 });
    addon.tab.displayNoneWhileDisabled(addBtn, { display: "inline" });
  });
  function addIDLink(e) {
    let idName = e.target.closest(".blockpost").querySelector(".box-head > .conr").textContent;
    let id = e.target.closest(".blockpost").id.substring(1);
    window.paste(getIDLink(id, idName, true));
  }
  function getIDLink(id, name, addSpace) {
    return `[url=https://scratch.mit.edu/discuss/post/${id}/]${name}[/url]${addSpace ? " " : ""}`;
  }
  //Auto-adding IDs to quotes
  const originalCopyPaste = window.copy_paste;
  window.copy_paste = function (id) {
    if (addon.self.disabled || !addon.settings.get("auto_add")) {
      originalCopyPaste(id);
      return;
    }
    var post = $("#" + id);
    var username = post.find(".username").text();
    $.ajax("/discuss/post/" + id.substr(1) + "/source/").done(function (data) {
      paste(
        "[quote=" +
          username +
          "][small](" +
          getIDLink(id.substring(1), post["0"].querySelector(".box-head > .conr").textContent, false) +
          ")[/small]\n" +
          data +
          "[/quote]\n"
      );
    });
  };
}
