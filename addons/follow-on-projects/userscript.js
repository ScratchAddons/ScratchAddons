export default async function ({ addon, msg }) {
  addon.tab.waitForElement(".title");

  const followUser = async (user, doFollow) => {
    return fetch(
      `https://scratch.mit.edu/site-api/users/followers/${user}/${doFollow ? "add" : "remove"}/?usernames=${username}`,
      {
        method: "PUT",
        headers: {
          "X-Csrftoken": addon.auth.csrfToken,
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    ).then((response) => response.status);
  };
  if (!(await addon.auth.fetchIsLoggedIn())) {
    return;
  }
  const adjustButton = () => {
    if (following) {
      followButton.textContent = msg("unfollow");
      followButton.title = msg("unfollow");
      followButton.classList.remove("notfollowing");
    } else {
      followButton.textContent = msg("follow");
      followButton.title = msg("follow");
      followButton.classList.add("notfollowing");
    }
    followButton.title = userExists ? followButton.title : msg("nonexistent", { name: creator });
  };

  const username = await addon.auth.fetchUsername();
  const title = document.querySelector(".title");
  if (title.querySelector("form")) {
    // this project is by the user running the addon
    return;
  }
  title.id = "profile-data"; // for confirm-actions

  const creator = title.querySelector("a").textContent;
  const userPage = await fetch(`https://scratch.mit.edu/users/${creator}/`).then((response) => ({
    text: response.text(),
    status: response.status,
  }));
  let following;
  const userExists = userPage.status === 200;
  if (userExists) {
    following = false;
  } else {
    following = (await userPage.text).includes('<div class="follow-button button notfollowing blue');
  }

  const followButton = document.createElement("button");
  followButton.classList.add("button", "follow-button"); // follow-button for confirm-actions
  followButton.id = "sa-follow-button";
  if (!userExists) {
    followButton.disabled = true;
  }
  adjustButton();
  followButton.addEventListener("click", async () => {
    const code = await followUser(creator, !following);
    if (code === 200) {
      following = !following;
      adjustButton();
    } else {
      alert(msg(`failed-${following ? "unfollowing" : "following"}`, { name: creator }));
    }
  });
  addon.tab.displayNoneWhileDisabled(followButton);

  // for confirm-actions
  const followText = document.createElement("span");
  followText.classList.add("follow", "sa-follow-on-projects-confirm-actions");
  followText.textContent = msg("follow");
  followButton.appendChild(followText);
  const unfollowText = document.createElement("span");
  unfollowText.classList.add("unfollow", "sa-follow-on-projects-confirm-actions");
  unfollowText.textContent = msg("unfollow");
  followButton.appendChild(unfollowText);

  title.appendChild(followButton);
}
