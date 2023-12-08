export default async function ({ addon, console, msg }) {
  document.addEventListener(
    "click",
    (e) => {
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
      }
      if (cancelMessage !== null) {
        if (!confirm(cancelMessage)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    },
    true
  );
}
