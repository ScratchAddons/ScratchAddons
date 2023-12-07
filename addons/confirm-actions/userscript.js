export default async function ({ addon, console, msg }) {
  let override = false;

  document.addEventListener(
    "click",
    (e) => {
      if (override) {
        override = false;
        return;
      }

      let title = null;
      let cancelMessage = null;
      if (
        addon.settings.get("projectsharing") &&
        e.target.closest(
          "[class*='share-button_share-button']:not([class*='is-shared']), .banner-text + .banner-button"
        )
      ) {
        title = addon.tab.scratchMessage("project.share.shareButton"); // "Share"
        cancelMessage = msg("share");
      } else if (
        addon.settings.get("projectunsharing") &&
        e.target.closest(".media-stats a.unshare") &&
        location.hash !== "#galleries"
      ) {
        title = e.target.closest(".media-stats a.unshare").textContent; // "Unshare"
        cancelMessage = msg("unshare");
      } else if (addon.settings.get("followinguser") && e.target.closest("#profile-data .follow-button")) {
        const button = e.target.closest("#profile-data .follow-button");
        if (button.classList.contains("notfollowing")) {
          title = button.querySelector("span.follow").textContent; // "Follow"
          cancelMessage = msg("follow");
        } else {
          title = button.querySelector("span.unfollow").textContent; // "Unfollow"
          cancelMessage = msg("unfollow");
        }
      } else if (
        ((/^\/studios\/\d+\/curators/g.test(location.pathname) &&
          e.target.closest("button.studio-invitation-button")) ||
          (location.pathname.startsWith("/messages") && e.target.closest(".sa-curator-invite-button"))) &&
        addon.settings.get("joiningstudio")
      ) {
        title = location.pathname.startsWith("/messages")
          ? msg("accept-invite")
          : addon.tab.scratchMessage("studio.curatorAcceptInvite");
        cancelMessage = msg("joinstudio");
      } else if (addon.settings.get("closingtopic") && e.target.closest("dd form button")) {
        title = msg("closetopic-title");
        cancelMessage = msg("closetopic");
      } else if (
        addon.settings.get("cancelcomment") &&
        e.target.closest("div[data-control='cancel'] > a, .compose-cancel")
      ) {
        // Do not ask to confirm canceling empty comments
        if (e.target.closest("form").querySelector("textarea").value === "") return;
        title = msg("cancelcomment-title");
        cancelMessage = msg("cancelcomment");
      } else if (addon.settings.get("removingprojects") && e.target.closest(".media-trash")) {
        title = msg("removeproject-title");
        cancelMessage = msg("removeproject");
      }

      if (cancelMessage !== null) {
        e.preventDefault();
        e.stopPropagation();
        addon.tab.scratchClassReady().then(() => {
          addon.tab
            .confirm(title, cancelMessage, {
              okButtonLabel: msg("yes"),
              cancelButtonLabel: msg("no"),
              useEditorClasses: addon.tab.editorMode === "editor",
            })
            .then((confirmed) => {
              if (confirmed) {
                override = true;
                e.target.click();
              }
            });
        });
      }
    },
    { capture: true }
  );
}
