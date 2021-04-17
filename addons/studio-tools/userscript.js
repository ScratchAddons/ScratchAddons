export default async function ({ addon, global, console, msg }) {
  const backbone = new Scratch.Gallery.CuratorList({ gallery_id: Scratch.INIT_DATA.GALLERY.model.id });

  const addedByExtension = document.createElement("span");
  addedByExtension.textContent = msg("added-by");
  addedByExtension.style.fontSize = ".7rem";
  addedByExtension.style.fontStyle = "italic";
  addedByExtension.style.marginLeft = "2px";
  if (document.getElementById("curator-action-bar")) {
    document.querySelector("#show-add-curator > span").textContent = msg("ipr");

    const promoteButton = document.createElement("div");
    promoteButton.className = "button grey small";
    promoteButton.style.marginLeft = "1px";
    const promoteSpan = document.createElement("span");
    promoteSpan.textContent = msg("promote");
    promoteButton.appendChild(promoteSpan);
    promoteButton.addEventListener("click", () => {
      const value = document.getElementById("curator_ids").value.trim();
      if (value) {
        document.getElementById("curator_ids").value = "";

        const fakeDiv = document.createElement("div");
        fakeDiv.setAttribute("data-id", value);
        fakeDiv.className = "avatar thumb vertical";
        const dummyChild = document.createElement("a");
        fakeDiv.appendChild(dummyChild);
        backbone.promoteCurator({ target: dummyChild });
      }
    });
    document.querySelector(".control-group.append-to-input").appendChild(promoteButton);

    const removeButton = document.createElement("div");
    removeButton.className = "button grey small";
    removeButton.style.marginLeft = "2px";
    const removeSpan = document.createElement("span");
    removeSpan.textContent = msg("remove");
    removeButton.appendChild(removeSpan);
    removeButton.addEventListener("click", () => {
      const value = document.getElementById("curator_ids").value.trim();
      if (value) {
        document.getElementById("curator_ids").value = "";

        const fakeDiv = document.createElement("div");
        fakeDiv.setAttribute("data-id", value);
        fakeDiv.className = "avatar thumb vertical";
        const dummyChild = document.createElement("a");
        fakeDiv.appendChild(dummyChild);
        backbone.removeCurator({ target: dummyChild });
      }
    });
    document.querySelector(".control-group.append-to-input").appendChild(removeButton);

    const leaveButton = document.createElement("div");
    leaveButton.className = "button grey small";
    leaveButton.style.marginLeft = "4px";
    const leaveSpan = document.createElement("span");
    leaveSpan.textContent = msg("leave");
    leaveButton.appendChild(leaveSpan);
    leaveButton.addEventListener("click", () => {
      // Note: `Scratch.INIT_DATA.GALLERY.model.is_owner` returns
      // whether the user is a *manager*, not _the_ owner
      if (addon.auth.username === Scratch.INIT_DATA.GALLERY.model.owner) {
        alert(msg("owner-error"));
      } else {
        const confirmation = confirm(msg("leave-confirm"));
        if (confirmation) {
          const fakeDiv = document.createElement("div");
          fakeDiv.setAttribute("data-id", Scratch.INIT_DATA.LOGGED_IN_USER.model.username);
          fakeDiv.className = "avatar thumb vertical";
          const dummyChild = document.createElement("a");
          fakeDiv.appendChild(dummyChild);
          backbone.removeCurator({ target: dummyChild });
          window.location.reload();
        }
      }
    });
    document
      .getElementById("curator-action-bar")
      .insertBefore(leaveButton, document.getElementById("show-add-curator").nextSibling);

    document.getElementById("curator-action-bar").insertBefore(addedByExtension, leaveButton.nextSibling);
  } else {
    const res = await fetch(`https://scratch.mit.edu/studios/${Scratch.INIT_DATA.GALLERY.model.id}/`);
    const text = await res.text();
    // Do not show if the user can't add projects (which would mean they can't leave)
    if (!text.includes('data-target="#projects"')) return;

    const leaveButton = document.createElement("div");
    leaveButton.className = "button grey small";
    leaveButton.style.marginLeft = "4px";
    const leaveSpan = document.createElement("span");
    leaveSpan.textContent = msg("leave");
    leaveButton.appendChild(leaveSpan);
    leaveButton.addEventListener("click", () => {
      const confirmation = confirm(msg("leave-confirm"));
      if (confirmation) {
        const fakeDiv = document.createElement("div");
        fakeDiv.setAttribute("data-id", Scratch.INIT_DATA.LOGGED_IN_USER.model.username);
        fakeDiv.className = "avatar thumb vertical";
        const dummyChild = document.createElement("a");
        fakeDiv.appendChild(dummyChild);
        backbone.removeCurator({ target: dummyChild });
        window.location.reload();
      }
    });
    const innerDiv = document.createElement("div");
    innerDiv.className = "inner";
    innerDiv.id = "curator-action-bar";
    innerDiv.appendChild(leaveButton);
    innerDiv.appendChild(addedByExtension);
    const actionBarDiv = document.createElement("div");
    actionBarDiv.className = "action-bar white scroll";
    actionBarDiv.appendChild(innerDiv);
    document
      .getElementById("tabs-content")
      .insertBefore(actionBarDiv, document.getElementById("tabs-content").firstChild);
  }
}
