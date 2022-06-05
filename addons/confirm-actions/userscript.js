export default async function (
  /** @type {import("../../addon-api/content-script/typedef.js").UserscriptUtilities} */ { addon, msg }
) {
  let override = false;
  document.addEventListener(
    "click",
    (e) => {
      if (override) {
        override = null;
        return;
      }
      let title = null;
      let cancelMessage = null;
      if (
        addon.settings.get("projectsharing") &&
        e.target.closest("[class*='share-button_share-button']:not([class*='is-shared']), .banner-button")
      ) {
        title = addon.tab.scratchMessage("project.share.shareButton");
        cancelMessage = msg("share");
      } else if (addon.settings.get("projectunsharing") && e.target.closest(".media-stats a.unshare")) {
        title = e.target.closest(".media-stats a.unshare").textContent;
        cancelMessage = msg("unshare");
      } else if (addon.settings.get("followinguser") && e.target.closest("#profile-data .follow-button")) {
        const button = e.target.closest("#profile-data .follow-button");
        if (button.classList.contains("notfollowing")) {
          title = button.querySelector("span.follow").textContent;
          cancelMessage = msg("follow");
        } else {
          title = button.querySelector("span.unfollow").textContent;
          cancelMessage = msg("unfollow");
        }
      } else if (
        /^\/studios\/\d+\/curators/g.test(location.pathname) &&
        addon.settings.get("joiningstudio") &&
        e.target.closest("button.studio-invitation-button")
      ) {
        title = addon.tab.scratchMessage("studio.curatorAcceptInvite");
        cancelMessage = msg("joinstudio");
      } else if (addon.settings.get("closingtopic") && e.target.closest("dd form button")) {
        title = msg("closetopic-title");
        cancelMessage = msg("closetopic");
      } else if (
        addon.settings.get("cancelcomment") &&
        e.target.closest("div[data-control='cancel'] > a, .compose-cancel")
      ) {
        title = msg("cancelcomment-title");
        cancelMessage = msg("cancelcomment");
      }
      if (cancelMessage !== null) {
        e.preventDefault();
        e.stopPropagation();
        addon.tab
          .confirm(title, cancelMessage, {
            okButtonLabel: msg("yes"),
            cancelButtonLabel: msg("no"),
          })
          .then((confirmed) => {
            if (confirmed) {
              override = true;
              e.target.click();
            }
          });
      }
    },
    true
  );
}
