export default async function ({ addon, global, console }) {
  const backbone = new Scratch.Gallery.CuratorList({ gallery_id: Scratch.INIT_DATA.GALLERY.model.id });
  if (document.getElementById("curator-action-bar")) {
    document.querySelector("#show-add-curator > span").textContent = "Invite/promote/remove curators";
    document.getElementById("show-add-curator").style.borderColor = "#ff7b26";

    const promoteButton = document.createElement("div");
    promoteButton.className = "button grey small";
    promoteButton.style.marginLeft = "1px";
    promoteButton.style.borderColor = "#ff7b26";
    const promoteSpan = document.createElement("span");
    promoteSpan.textContent = "Promote curator";
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
    removeButton.style.borderColor = "#ff7b26";
    const removeSpan = document.createElement("span");
    removeSpan.textContent = "Remove curator";
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
    leaveButton.style.borderColor = "#ff7b26";
    const leaveSpan = document.createElement("span");
    leaveSpan.textContent = "Leave studio";
    leaveButton.appendChild(leaveSpan);
    leaveButton.addEventListener("click", () => {
      if (Scratch.INIT_DATA.GALLERY.model.is_owner) {
        alert("The owner of a studio can't leave.");
      } else {
        const confirmation = confirm("Are you sure you want to leave this studio?");
        if (confirmation) {
          const fakeDiv = document.createElement("div");
          fakeDiv.setAttribute("data-id", Scratch.INIT_DATA.LOGGED_IN_USER.model.username);
          fakeDiv.className = "avatar thumb vertical";
          const dummyChild = document.createElement("a");
          fakeDiv.appendChild(dummyChild);
          backbone.removeCurator({ target: dummyChild });
        }
      }
    });
    document
      .getElementById("curator-action-bar")
      .insertBefore(leaveButton, document.getElementById("show-add-curator").nextSibling);
  } else {
    const res = await fetch(`https://scratch.mit.edu/studios/${Scratch.INIT_DATA.GALLERY.model.id}/`);
    const text = await res.text();
    // Do not show if the user can't add projects (which would mean they can't leave)
    if (!text.includes('data-target="#projects"')) return;

    const leaveButton = document.createElement("div");
    leaveButton.className = "button grey small";
    leaveButton.style.marginLeft = "4px";
    leaveButton.style.borderColor = "#ff7b26";
    const leaveSpan = document.createElement("span");
    leaveSpan.textContent = "Leave studio";
    leaveButton.appendChild(leaveSpan);
    leaveButton.addEventListener("click", () => {
      const confirmation = confirm("Are you sure you want to leave this studio?");
      if (confirmation) {
        const fakeDiv = document.createElement("div");
        fakeDiv.setAttribute("data-id", Scratch.INIT_DATA.LOGGED_IN_USER.model.username);
        fakeDiv.className = "avatar thumb vertical";
        const dummyChild = document.createElement("a");
        fakeDiv.appendChild(dummyChild);
        backbone.removeCurator({ target: dummyChild });
      }
    });
    const innerDiv = document.createElement("div");
    innerDiv.className = "inner";
    innerDiv.id = "curator-action-bar";
    innerDiv.appendChild(leaveButton);
    const actionBarDiv = document.createElement("div");
    actionBarDiv.className = "action-bar white scroll";
    actionBarDiv.appendChild(innerDiv);
    document
      .getElementById("tabs-content")
      .insertBefore(actionBarDiv, document.getElementById("tabs-content").firstChild);
  }
}
