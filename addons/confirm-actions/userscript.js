export default async function ({ addon, console, msg }) {
  let override = false;

  document.addEventListener(
    "click",
    (e) => {
      if (override) {
        override = false;
        return;
      }

      let confirmationTitle = null;
      let confirmationMessage = null;

      // Check if the user is performing one of the following actions...

      // Share Project
      if (
        addon.settings.get("projectsharing") &&
        e.target.closest(
          "[class*='share-button_share-button']:not([class*='is-shared']), .banner-text + .banner-button"
        )
      ) {
        confirmationTitle = addon.tab.scratchMessage("project.share.shareButton");
        confirmationMessage = msg("share");
      }
      // Unshare Project
      else if (
        addon.settings.get("projectunsharing") &&
        e.target.closest(".media-stats a.unshare") &&
        location.hash !== "#galleries"
      ) {
        confirmationTitle = e.target.closest(".media-stats a.unshare").textContent;
        confirmationMessage = msg("unshare");
      }
      // Follow/Unfollow User
      else if (addon.settings.get("followinguser") && e.target.closest("#profile-data .follow-button")) {
        const button = e.target.closest("#profile-data .follow-button");
        if (button.classList.contains("notfollowing")) {
          confirmationTitle = button.querySelector("span.follow").textContent;
          confirmationMessage = msg("follow");
        } else {
          confirmationTitle = button.querySelector("span.unfollow").textContent;
          confirmationMessage = msg("unfollow");
        }
      }
      // Accept Studio Invite
      else if (
        ((/^\/studios\/\d+\/curators/g.test(location.pathname) &&
          e.target.closest("button.studio-invitation-button")) ||
          (location.pathname.startsWith("/messages") && e.target.closest(".sa-curator-invite-button"))) &&
        addon.settings.get("joiningstudio")
      ) {
        confirmationTitle = location.pathname.startsWith("/messages")
          ? msg("accept-invite")
          : addon.tab.scratchMessage("studio.curatorAcceptInvite");
        confirmationMessage = msg("joinstudio");
      }
      // Close Forum Topic
      else if (addon.settings.get("closingtopic") && e.target.closest("dd form button")) {
        confirmationTitle = msg("closetopic-title");
        confirmationMessage = msg("closetopic");
      }
      // Cancel Pending Comment
      else if (addon.settings.get("cancelcomment")) {
        if (e.target.closest("div[data-control='cancel'] > a, .compose-cancel")) {
          // Do not ask to confirm canceling empty comments
          if (e.target.closest("form").querySelector("textarea").value === "") return;
          confirmationTitle = msg("cancelcomment-title");
          confirmationMessage = msg("cancelcomment");
        }
        // Clicking "Reply" while writing a reply also discards the comment
        else if (e.target.closest("a[data-control='reply-to'], .comment-reply")) {
          // Do not ask to confirm canceling empty comments
          if (e.target.closest(".comment .info, .comment-body").querySelector("textarea")?.value.length > 0) {
            confirmationTitle = msg("cancelcomment-title");
            confirmationMessage = msg("cancelcomment");
          }
        }
      }
      // Send Project to Trash
      else if (addon.settings.get("removingprojects") && e.target.closest(".media-trash")) {
        confirmationTitle = msg("removeproject-title");
        confirmationMessage = msg("removeproject");
      }

      // If one of the actions above is being taken, prevent it and show confirmation prompt
      if (confirmationMessage !== null) {
        e.preventDefault();
        e.stopPropagation();
        addon.tab.scratchClassReady().then(() => {
          addon.tab
            .confirm(confirmationTitle, confirmationMessage, {
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
