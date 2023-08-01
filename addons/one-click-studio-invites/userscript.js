export default async function (
  /** @type {import("../../addon-api/content-script/typedef").UserscriptUtilities} */ { addon, msg, console }
) {
  const STUDIO_REGEX = /https:\/\/scratch\.mit\.edu\/studios\/([0-9]+)/;
  const xToken = await addon.auth.fetchXToken();
  const username = await addon.auth.fetchUsername();
  const { csrfToken } = addon.auth;

  const cache = Object.create(null);

  await addon.tab.redux.waitForState((state) => state.messages.status.message === "FETCHED");
  main: while (true) {
    const invite = await addon.tab.waitForElement(".mod-curator-invite", { markAsSeen: true });
    const inviteTextContainer = await addon.tab.waitForElement(".social-message-content > div > span", {
      elementCondition: (el) => invite.contains(el),
    });

    const studioId = Array.from(inviteTextContainer.children)
      .find((node) => node.tagName === "A" && STUDIO_REGEX.test(node.href))
      .href.match(STUDIO_REGEX)[1];
    if (cache[studioId]) {
      continue main;
    } else {
      cache[studioId] = true;
    }
    const userProfileRes = await fetch(`https://api.scratch.mit.edu/studios/${studioId}/users/${username}`, {
      headers: {
        "X-Token": xToken,
      },
    });
    let userProfile = await userProfileRes.json();

    const button = document.createElement("button");
    button.className = "sa-curator-invite-button button";

    if (userProfile.invited) {
      button.innerText = msg("accept");
    } else {
      button.innerText = msg("accepted");
      button.classList.add("disabled");
      button.disabled = true;
    }

    addon.tab.displayNoneWhileDisabled(button, { display: "block" });

    button.addEventListener("click", async () => {
      if (userProfile.invited) {
        button.classList.add("loading");
        const addCurator = await fetch(`/site-api/users/curators-in/${studioId}/add/?usernames=${username}`, {
          method: "PUT",
          headers: {
            "x-csrftoken": csrfToken,
            "x-requested-with": "XMLHttpRequest",
          },
        });
        const { success } = await addCurator.json();

        button.classList.remove("loading");
        if (success) {
          button.innerText = msg("accepted");
          userProfile.invited = false;
          button.disabled = true;
        } else {
          alert(msg("failed"));
        }
      }
    });

    inviteTextContainer.parentElement.appendChild(button);
  }
}
