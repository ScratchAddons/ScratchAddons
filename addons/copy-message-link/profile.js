export default async function ({ addon, global, console, msg }) {
  let amtOfComments = 0;
  let pass = 0;
  while (true) {
    const newAmtOfComments = document.querySelectorAll("div.comment").length;
    if (amtOfComments !== newAmtOfComments) {
      pass++;
      amtOfComments = newAmtOfComments;
    }
    const comment = await addon.tab.waitForElement(`div.comment:not([data-sa-copy-link-pass='${pass}'])`);
    comment.dataset.saCopyLinkPass = pass;
    if (comment.querySelector(".sa-copy-link-btn")) {
      // This will to all comments after posting a new one,
      // and to the first comment on every loaded page.
      // Do not readd button if we already added it
      continue;
    }
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
