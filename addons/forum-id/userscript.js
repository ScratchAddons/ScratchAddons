import { setupForumId, getIDLink } from "../better-quoter/module.js";
export default async function ({ addon, console, msg }) {
  if (!document.querySelector("textarea")) return;
  setupForumId(addon);
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
}
