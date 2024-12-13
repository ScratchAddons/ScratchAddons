export default async function ({ addon, console, msg }) {
  //define remix tree button elements
  while (true) {
    await addon.tab.waitForElement(".flex-row.subactions > .flex-row.action-buttons", {
      markAsSeen: true,
      reduxEvents: [
        "SET_PROJECT_INFO",
        "scratch-gui/mode/SET_PLAYER",
        "fontsLoaded/SET_FONTS_LOADED",
        "scratch-gui/locales/SELECT_LOCALE",
      ],
      resizeEvent: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });
    const remixtree = document.createElement("button");

    const remixtreeSpan = document.createElement("span");
    remixtreeSpan.innerText = msg("remix-tree");
    addon.tab.displayNoneWhileDisabled(remixtree);
    remixtree.className = "button action-button remixtree-button";
    remixtree.id = "scratchAddonsRemixTreeBtn";
    remixtree.appendChild(remixtreeSpan);
    remixtree.addEventListener("click", () => {
      window.location.href = `https://scratch.mit.edu/projects/${
        window.location.href.split("projects")[1].split("/")[1]
      }/remixtree`;
    });
    addon.tab.appendToSharedSpace({ space: "afterCopyLinkButton", element: remixtree, order: 0 });
  }
}
