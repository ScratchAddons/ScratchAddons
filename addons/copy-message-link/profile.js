export default async function ({ addon, console, msg }) {
  let amtOfComments = 0;
  let pass = 0;
  while (true) {
    const comment = await addon.tab.waitForElement("div.comment:not(.sa-copy-link)", {
      markAsSeen: true,
    });
    comment.classList.add("sa-copy-link");

    const newElem = document.createElement("span");
    addon.tab.displayNoneWhileDisabled(newElem);
    newElem.className = "actions report sa-copy-link-btn";
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
    comment.querySelector("div.actions-wrap").appendChild(newElem);
  }
}
