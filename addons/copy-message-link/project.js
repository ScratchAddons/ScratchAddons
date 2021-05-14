export default async function ({ addon, global, console, msg }) {
  while (true) {
    const comment = await addon.tab.waitForElement("div.comment", {
      markAsSeen: true,
    });
    if (comment.querySelector("form")) continue; // Comment input
    const newElem = document.createElement("span");
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
    comment.querySelector("div.action-list").prepend(newElem);
  }
}
