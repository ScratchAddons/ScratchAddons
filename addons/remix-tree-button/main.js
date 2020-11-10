export default async function ({ addon, global, console }) {
  //define remix tree button elements
  function loadRemixButton() {
    if (document.querySelector("#scratchAddonsRemixTreeBtn")) return;
    if (addon.tab.editorMode == "projectpage") {
      addon.tab.waitForElement(".flex-row.subactions").then(() => {
        const subactions = document.querySelector(".flex-row.subactions").querySelector(".action-buttons");

        const remixtree = document.createElement("button");

        const remixtreeSpan = document.createElement("span");
        remixtreeSpan.innerText = "Remix Tree";
        remixtree.className = "button action-button remixtree-button";
        remixtree.id = "scratchAddonsRemixTreeBtn";
        remixtree.appendChild(remixtreeSpan);
        remixtree.addEventListener("click", () => {
          window.location.href = `https://scratch.mit.edu/projects/${
            window.location.href.split("projects")[1].split("/")[1]
          }/remixtree`;
        });
        if (addon.settings.get("buttonColor")) {
          remixtree.style.backgroundColor = addon.settings.get("buttonColor");
        }
        subactions.appendChild(remixtree);
      });
    }
  }

  loadRemixButton();
  addon.tab.addEventListener("urlChange", () => {
    loadRemixButton();
  });
}
