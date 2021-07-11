export default async function ({ addon, global, console, msg }) {
  while (true) {
    const comment = await addon.tab.waitForElement("div.comment", {
      markAsSeen: true,
      reduxCondition: (state) => {
        if (!state.scratchGui) return true;
        return state.scratchGui.mode.isPlayerOnly;
      },
    });
    if (comment.querySelector("form")) continue; // Comment input
    const newElem = document.createElement("span");
    addon.tab.displayNoneWhileDisabled(newElem);
    newElem.className = "comment-delete sa-comment-link";
    newElem.textContent = msg("copyLink");
    newElem.onclick = () => {
      let url = `${location.origin}${location.pathname}`;
      if (url[url.length - 1] !== "/") url += "/";
      navigator.clipboard.writeText(`${url}#${comment.id}`);
      newElem.textContent = msg("copied");
      newElem.style.fontWeight = "bold";
      setTimeout(() => {
        newElem.textContent = msg("copyLink");
        newElem.style.fontWeight = "";
      }, 5000);
    };
    const actionList = await addon.tab.waitForElement("div.action-list", {
      markAsSeen: true,
      elementCondition: (e) => comment.contains(e),
    });
    actionList.prepend(newElem);
  }
}
