import createModal from "./create-modal.js";
export default async function ({ addon, global, console, msg }) {
  const { redux } = addon.tab;

  var offset = 0;

  const modal = createModal(addon, msg("modal-title"));

  document.body.appendChild(modal);

  let grid = modal.querySelector(".sa-followers-modal-grid");

  async function getFollowers() {
    let res = await fetch(`https://api.scratch.mit.edu/users/${addon.auth.username}/followers?offset=${offset}`);
    let json = await res.json();
    offset += 20;
    let members = redux.state.managers.items.concat(redux.state.curators.items).map((member) => member.username);
    return json.map((follower) => {
      const btn = Object.assign(document.createElement("div"), {
        className: "studio-follower mod-clickable",
        tabindex: "0",
        role: "button",
      });
      const userImage = Object.assign(document.createElement("img"), {
        className: "studio-follower-pfp",
        src: `https://cdn2.scratch.mit.edu/get_image/user/${follower.id}_90x90.png`,
      });

      btn.appendChild(userImage);

      const bottom = Object.assign(document.createElement("div"), {
        className: "studio-follower-bottom",
      });
      const username = Object.assign(document.createElement("div"), {
        className: "studio-follower-username",
        innerText: follower.username,
        title: follower.username,
      });
      bottom.appendChild(username);

      const add = Object.assign(document.createElement("div"), {
        className: "studio-tile-dynamic-add",
      });

      const img = Object.assign(document.createElement("img"), {
        className: "studio-follower-add-remove-image",
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
        let json = await res.json();
        btn.classList.remove("mod-mutating");
        add.classList.add("studio-follower-dynamic-remove");
        img.src = addon.self.dir + "/tick.svg";
        btn.removeEventListener("click", onclick);
      };

      if (!members.includes(follower.username)) {
        btn.addEventListener("click", onclick);
      } else {
        btn.classList.remove("mod-mutating");
        add.classList.add("studio-follower-dynamic-remove");
        img.src = addon.self.dir + "/tick.svg";
      }

      add.appendChild(img);
      bottom.appendChild(add);
      btn.appendChild(bottom);
      return btn;
    });
  }

  async function initialize() {
    let button = document.createElement("button");
    button.className = "button";
    button.innerText = msg("button");
    button.addEventListener("click", () => {
      modal.style.display = modal.style.display == "none" ? null : "none";
    });
    let adjacent = await addon.tab.waitForElement(".studio-members");
    let parent = adjacent.parentNode;
    adjacent.insertAdjacentElement("beforeBegin", button);
  }
  addon.tab.addEventListener("urlChange", (e) => {
    if (location.pathname.split("/")[3] == "curators") {
      initialize();
    }
  });
  if (location.pathname.split("/")[3] == "curators") {
    initialize();
  }
  while (true) {
    let followers = await getFollowers();

    if (followers.length == 0) break;

        followers.map(follower => grid.appendChild(follower))
    }
}
