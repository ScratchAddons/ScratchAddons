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
      let cancelMessage = null;
      if (
        addon.settings.get("projectsharing") &&
        e.target.closest("[class*='share-button_share-button']:not([class*='is-shared']), .banner-button")
      ) {
        cancelMessage = msg("share");
      } else if (addon.settings.get("projectunsharing") && e.target.closest(".media-stats a.unshare")) {
        cancelMessage = msg("unshare");
      } else if (addon.settings.get("followinguser") && e.target.closest("#profile-data .follow-button")) {
        cancelMessage = msg("follow");
      } else if (
        /^\/studios\/\d+\/curators/g.test(location.pathname) &&
        addon.settings.get("joiningstudio") &&
        e.target.closest("button.studio-invitation-button")
      ) {
        cancelMessage = msg("joinstudio");
      } else if (addon.settings.get("closingtopic") && e.target.closest("dd form button")) {
        cancelMessage = msg("closetopic");
      } else if (
        addon.settings.get("cancelcomment") &&
        e.target.closest("div[data-control='cancel'] > a, .compose-cancel")
      ) {
        cancelMessage = msg("cancelcomment");
      }
      if (cancelMessage !== null) {
        e.preventDefault();
        e.stopPropagation();
        addon.tab.confirm(msg("title"), cancelMessage).then((confirmed) => {
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
