export default async function ({ addon, global, console, msg }) {
  while (true) {
    const reportBtn = await addon.tab.waitForElement("span.actions[data-control='report']", {
      markAsSeen: true,
    });
    const comment = reportBtn.closest("div.comment");
    const newElem = document.createElement("span");
    newElem.className = "actions report";
    newElem.textContent = msg("copyLink");
    newElem.onclick = () => {
      // For profiles, respect correct username casing in URL
      let url =
        location.pathname.split("/")[1] === "users"
          ? `${location.origin}/users/${Scratch.INIT_DATA.PROFILE.model.id}/`
          : `${location.origin}${location.pathname}`;
      navigator.clipboard.writeText(`${url}#${comment.id}`);
      newElem.textContent = msg("copied");
      newElem.style.fontWeight = "bold";
      setTimeout(() => {
        newElem.textContent = msg("copyLink");
        newElem.style.fontWeight = "";
      }, 5000);
    };
    reportBtn.after(newElem);
  }
}
