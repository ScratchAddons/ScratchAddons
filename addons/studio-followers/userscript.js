import { createModal, createUser } from "./lib.js";

export default async function ({ addon, global, console, msg }) {
  let { redux } = addon.tab;
  // Same waitForState as studio-tools
  await redux.waitForState(
    (state) => state.studio?.infoStatus === "FETCHED" && state.studio?.rolesStatus === "FETCHED",
    {
      actions: ["SET_INFO", "SET_ROLES"],
    }
  );
  let members = redux.state.managers.items.concat(redux.state.curators.items).map((member) => member.username);

  if (!(redux.state.studio.manager || redux.state.studio.owner === redux.state.session.session?.user?.id)) return; // This user is not a manager
  let data = {
    followers: {
      offset: -40,
      activated: false,
    },
    following: {
      offset: -40,
      activated: false,
    },
  };
  let currentType = "followers";

  let modal = createModal(addon, msg("modal-title"), msg, (nextType) => {
    if (nextType == currentType) return;
    data[nextType].grid.style.display = null;
    if (!data[nextType].activated) {
      data[nextType].activated = true;
      loadData(nextType);
    }
    data[currentType].grid.style.display = "none";
    currentType = nextType;
  });

  document.body.appendChild(modal);

  data.followers.grid = modal.querySelector(".followers");
  data.following.grid = modal.querySelector(".following");

  var isFetching = false;
  async function loadData(type) {
    if (isFetching) return;
    isFetching = true;
    data[type].offset += 40;
    let res = await fetch(
      `https://api.scratch.mit.edu/users/${addon.auth.username}/${type}?offset=${data[type].offset}&limit=40`
    );
    let json = await res.json();
    let username = json.map((follower) => {
      let user = createUser(follower, addon, msg, members);
      data[type].grid.appendChild(user);
      return follower.username;
    });
    isFetching = false;
    return username;
  }

  async function init() {
    let btn = document.getElementById("sa-studio-followers-btn");
    if (btn) {
      btn.style.display = "";
      return;
    }

    btn = document.createElement("button");
    btn.className = "button";
    btn.id = "sa-studio-followers-btn";
    btn.innerText = msg("button");
    btn.addEventListener("click", () => {
      modal.style.display = modal.style.display == "none" ? null : "none";
      if (!data[currentType].activated) {
        data[currentType].activated = true;
        loadData(currentType);
      }
    });

    addon.tab.appendToSharedSpace({ space: "studioCuratorsTab", element: btn, order: 0 });
  }

  addon.tab.addEventListener("urlChange", (e) => {
    // Studios page dynamically changes the url
    if (location.pathname.split("/")[3] == "curators") {
      init();
    } else {
      let button = document.getElementById("sa-studio-followers-btn");
      if (button) button.style.display = "none";
    }
  });

  if (location.pathname.split("/")[3] == "curators") {
    init();
  }

  // Infinite scrolling

  function checkVisible(el, container) {
    var rect = el.getBoundingClientRect();
    var viewHeight = container.height;
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
  }

  let flex = data.followers.grid.parentNode;

  data.followers.grid.addEventListener("wheel", (e) => {
    let els = [].slice.apply(data.followers.grid.childNodes);
    if (checkVisible(els[els.length - 1], flex)) {
      loadData("followers");
    }
  });

  data.following.grid.addEventListener("wheel", (e) => {
    let els = [].slice.apply(data.following.grid.childNodes);
    if (checkVisible(els[els.length - 1], flex)) {
      loadData("following");
    }
  });
}
