export function createModal(addon, title, msg, switchType) {
  const { backdrop, container, content, closeButton, close } = addon.tab.createModal(title, { useSizesClass: false });

  container.classList.add("user-projects-modal");
  container.classList.add("sa-followers-main");
  container.querySelector(".modal-header").classList.add("user-projects-modal-title");

  backdrop.addEventListener("click", close);
  closeButton.addEventListener("click", close);

  const switcher = document.createElement("div");
  switcher.className = "sub-nav user-projects-modal-nav sub-nav-align-left";

  function createBtn(txt, active) {
    let btn = document.createElement("button");
    btn.className = active ? "active" : "";
    btn.innerText = txt;
    switcher.appendChild(btn);
    return btn;
  }

  const followers = createBtn(msg("followers"), true);
  followers.addEventListener("click", () => {
    following.classList.remove("active");
    followers.classList.add("active");
    switchType("followers");
  });
  const following = createBtn(msg("following"));
  following.addEventListener("click", () => {
    followers.classList.remove("active");
    following.classList.add("active");
    switchType("following");
  });

  content.parentElement.insertBefore(switcher, content);

  content.classList.add("user-projects-modal-content");

  const followersGrid = document.createElement("div");
  followersGrid.className = "user-projects-modal-grid sa-followers-modal-grid followers";

  const followingGrid = document.createElement("div");
  followingGrid.className = "user-projects-modal-grid sa-followers-modal-grid following";
  followingGrid.style.display = "none";

  content.appendChild(followersGrid);
  content.appendChild(followingGrid);

  const doneBtnContainer = document.createElement("div");
  doneBtnContainer.className = "studio-projects-done-row";

  const doneBtn = document.createElement("button");
  doneBtn.className = "button";
  doneBtn.innerText = addon.tab.scratchMessage("general.done");

  doneBtn.addEventListener("click", () => close());

  doneBtnContainer.appendChild(doneBtn);

  content.parentElement.appendChild(doneBtnContainer);

  return backdrop;
}

export function createUser(follower, addon, msg, members) {
  let { redux } = addon.tab;
  const btn = Object.assign(document.createElement("div"), {
    className: "mod-clickable studio-project-tile studio-follower",
    tabindex: "0",
    role: "button",
  });
  const userImage = Object.assign(document.createElement("img"), {
    className: "studio-project-image",
    src: `https://uploads.scratch.mit.edu/get_image/user/${follower.id}_90x90.png`,
  });

  btn.appendChild(userImage);

  const bottom = Object.assign(document.createElement("div"), {
    className: "studio-project-bottom",
  });
  const username = Object.assign(document.createElement("div"), {
    className: "studio-project-title",
    innerText: follower.username,
    title: follower.username,
  });
  bottom.appendChild(username);

  const add = Object.assign(document.createElement("div"), {
    className: "studio-tile-dynamic-add",
  });

  const img = Object.assign(document.createElement("img"), {
    className: "studio-project-add-remove-image",
    src: addon.self.dir + "/add.svg",
  });

  let onclick = async (e) => {
    btn.classList.remove("mod-clickable");
    btn.classList.add("mod-mutating");
    // Add user as a curator
    let res = await fetch(
      `/site-api/users/curators-in/${redux.state.studio.id}/invite_curator/?usernames=${follower.username}`,
      {
        headers: {
          "x-csrftoken": addon.auth.csrfToken,
          "x-requested-with": "XMLHttpRequest",
        },
        method: "PUT",
        credentials: "include",
      }
    );

    if (res.status !== 200) {
      return alert(msg("fetch-error"));
    }
    btn.classList.remove("mod-mutating");
    add.classList.add("studio-tile-dynamic-remove");
    img.src = addon.self.dir + "/tick.svg";
    btn.removeEventListener("click", onclick);
  };

  if (!members.includes(follower.username)) {
    btn.addEventListener("click", onclick);
  } else {
    btn.classList.remove("mod-mutating");
    add.classList.add("studio-tile-dynamic-remove");
    img.src = addon.self.dir + "/tick.svg";
  }

  add.appendChild(img);
  bottom.appendChild(add);
  btn.appendChild(bottom);

  return btn;
}
