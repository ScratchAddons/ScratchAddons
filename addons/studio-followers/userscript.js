export default async function ({ addon, console, msg }) {
  const { redux } = addon.tab;
  // Same waitForState as remix-button
  await redux.waitForState((state) => typeof state.session.session?.user === "object");
  const username = await addon.auth.fetchUsername();
  // Same waitForState as studio-tools
  await redux.waitForState(
    (state) => state.studio?.infoStatus === "FETCHED" && state.studio?.rolesStatus === "FETCHED",
    {
      actions: ["SET_INFO", "SET_ROLES"],
    }
  );
  const getMembers = () =>
    [...redux.state.managers.items, ...redux.state.curators.items].map((member) => member.username);

  const isOwner = (redux.state.studio.host || redux.state.studio.owner) === redux.state.session.session?.user?.id;
  const isManager = redux.state.studio.manager || isOwner;
  if (!isManager) return;
  const pageLimit = 28;
  const data = {
    followers: {
      offset: -pageLimit,
      activated: false,
      grid: null,
      gridScrollPosition: 0,
      moreButton: null,
      fetchedAll: false,
      button: null,
    },
    following: {
      offset: -pageLimit,
      activated: false,
      grid: null,
      gridScrollPosition: 0,
      moreButton: null,
      fetchedAll: false,
      button: null,
    },
  };
  let current = "followers";
  let isFetching = false;

  // modal creation
  const { backdrop, container, content, closeButton, close } = addon.tab.createModal(msg("modal-title"), {
    useSizesClass: false,
  });
  container.classList.add("user-projects-modal", "sa-followers-main");
  content.classList.add("user-projects-modal-content");
  container.querySelector(".modal-header").classList.add("user-projects-modal-title");

  backdrop.addEventListener("click", close);
  closeButton.addEventListener("click", close);

  // create switcher
  const switcher = document.createElement("div");
  switcher.className = "sub-nav user-projects-modal-nav sub-nav-align-left";
  data.followers.button = createButtonForSwitcher("followers", true);
  data.following.button = createButtonForSwitcher("following", false);
  content.parentElement.insertBefore(switcher, content);

  // create grid
  const followersGrid = (data.followers.grid = document.createElement("div"));
  followersGrid.className = "user-projects-modal-grid sa-followers-modal-grid";
  const followingGrid = (data.following.grid = document.createElement("div"));
  followingGrid.className = "user-projects-modal-grid sa-followers-modal-grid";
  followingGrid.style.display = "none";
  content.appendChild(followersGrid);
  content.appendChild(followingGrid);

  // create done button
  const doneButtonContainer = document.createElement("div");
  doneButtonContainer.className = "studio-projects-done-row";
  const doneButton = document.createElement("button");
  doneButton.className = "button";
  doneButton.innerText = addon.tab.scratchMessage("general.done");
  doneButton.addEventListener("click", close);
  doneButtonContainer.appendChild(doneButton);
  content.parentElement.appendChild(doneButtonContainer);
  // modal creation end

  addon.tab.addEventListener("urlChange", onPageChange);
  const flex = data.followers.grid.parentNode; // div.user-projects-modal-content

  flex.addEventListener(
    "scroll",
    (e) => {
      const userButtons = Array.from(data[current].grid.childNodes);
      if (checkVisible(userButtons[userButtons.length - 1], flex) && flex.getAttribute("data-scrollable") === "true") {
        loadData(current);
      }
    },
    { passive: true }
  );

  addon.self.addEventListener("disabled", () => close());
  onPageChange();

  async function loadData(type) {
    if (isFetching) return;
    if (data[type].fetchedAll) return;
    if (data[type].moreButton) data[type].moreButton.classList.add("mod-mutating");
    isFetching = true;
    const res = await fetch(
      `https://api.scratch.mit.edu/users/${username}/${type}?offset=${(data[type].offset +=
        pageLimit)}&limit=${pageLimit}`
    );
    if (!res.ok) {
      // Cooldown in case something went wrong
      setTimeout(() => (isFetching = false), 1000);
      return;
    }
    const users = await res.json();
    const usernames = users.map((user) => {
      const userButton = Object.assign(document.createElement("div"), {
        className: "mod-clickable studio-project-tile studio-follower",
        tabindex: "0",
        role: "button",
      });
      const userAvatar = Object.assign(document.createElement("img"), {
        className: "studio-project-image",
        src: `https://uploads.scratch.mit.edu/get_image/user/${user.id}_90x90.png`,
        draggable: false,
      });
      userButton.appendChild(userAvatar);

      const bottom = Object.assign(document.createElement("div"), {
        className: "studio-project-bottom",
      });
      const username = Object.assign(document.createElement("div"), {
        className: "studio-project-title",
        innerText: user.username,
        title: user.username,
      });
      bottom.appendChild(username);

      const addButton = Object.assign(document.createElement("div"), {
        className: "studio-tile-dynamic-add",
      });
      const img = Object.assign(document.createElement("img"), {
        className: "studio-project-add-remove-image",
        src: addon.self.dir + "/add.svg",
        draggable: false,
      });
      addButton.appendChild(img);

      const clickListener = async () => {
        addButton.classList.remove("mod-clickable");
        addButton.classList.add("mod-mutating");
        await addCurator(user.username);
        addButton.classList.remove("mod-mutating");
        userButton.classList.add("studio-follower-added");
        addButton.classList.add("studio-tile-dynamic-add");
        addButton.classList.add("studio-tile-dynamic-remove");
        img.src = addon.self.dir + "/tick.svg";
        userButton.removeEventListener("click", clickListener);
      };
      if (getMembers().includes(user.username)) {
        addButton.classList.remove("mod-mutating", "studio-tile-dynamic-remove");
        userButton.classList.add("studio-follower-added");
        img.src = addon.self.dir + "/tick.svg";
      } else {
        userButton.addEventListener("click", clickListener);
      }

      bottom.appendChild(addButton);
      userButton.appendChild(bottom);
      data[type].grid.appendChild(userButton);

      return user.username;
    });
    if (data[type].moreButton) data[type].moreButton.remove();
    if (users.length < pageLimit) data[type].fetchedAll = true;
    else if (data[type].grid.parentNode.getAttribute("data-scrollable") !== "true") {
      const moreButton = document.createElement("div");
      data[type].moreButton = moreButton;
      data[type].grid.appendChild(moreButton);
      moreButton.className = "studio-grid-load-more";
      const moreButtonInner = document.createElement("button");
      moreButton.appendChild(moreButtonInner);
      moreButtonInner.className = "button";
      moreButtonInner.innerText = addon.tab.scratchMessage("general.loadMore");
      moreButtonInner.addEventListener("click", (e) => {
        loadData(type);
        e.stopPropagation();
      });
    }
    isFetching = false;
    return usernames;
  }
  async function init() {
    let button = document.getElementById("sa-studio-followers-button");
    if (button) button.classList.remove("hidden");
    else {
      button = document.createElement("button");
      button.className = "button";
      button.id = "sa-studio-followers-button";
      button.innerText = msg("button");
      addon.tab.displayNoneWhileDisabled(button);
      button.addEventListener("click", () => {
        backdrop.style.display = backdrop.style.display === "none" ? null : "none";
        if (!data[current].activated) {
          data[current].activated = true;
          loadData(current);
        }
      });

      addon.tab.appendToSharedSpace({ space: "studioCuratorsTab", element: button, order: 0 });
    }
  }
  async function addCurator(username) {
    const res = await fetch(
      `/site-api/users/curators-in/${redux.state.studio.id}/invite_curator/?usernames=${username}`,
      {
        headers: {
          "x-csrftoken": addon.auth.csrfToken,
          "x-requested-with": "XMLHttpRequest",
        },
        method: "PUT",
        credentials: "include",
      }
    );
    await res.body.cancel(); // prevent memory leakage
    if (res.status !== 200) {
      return alert(msg("fetch-error"));
    }
    return true;
  }
  function createButtonForSwitcher(type, active) {
    const button = document.createElement("button");
    button.className = active ? "active" : "";
    button.innerText = msg(type);
    button.addEventListener("click", (ev) => {
      if (current === type) return;
      const newButton = data[type].button;
      newButton.classList.add("active");
      data[current].button.classList.remove("active");

      data[current].gridScrollPosition = data[current].grid.parentElement.scrollTop;
      data[type].grid.style.display = null;
      data[type].grid.parentElement.scrollTop = data[type].gridScrollPosition;
      if (!data[type].activated) {
        data[type].activated = true;
        loadData(type);
      }
      data[current].grid.style.display = "none";
      current = type;
    });
    switcher.appendChild(button);
    return button;
  }
  function checkVisible(el, container) {
    const { bottom, height, top } = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return top <= containerRect.top ? containerRect.top - top <= height : bottom - containerRect.bottom <= height;
  }
  function onPageChange() {
    // Studios page dynamically changes the url
    if (location.pathname.split("/")[3] === "curators") {
      init();
    } else {
      const button = document.getElementById("sa-studio-followers-button");
      if (button) button.classList.add("hidden");
    }
  }
}
