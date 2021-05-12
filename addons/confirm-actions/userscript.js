export default async function ({ addon, console, msg }) {
  document.addEventListener(
    "click",
    (e) => {
      let cancelMessage = null;
      if (
        addon.settings.get("projectsharing") &&
        e.target.closest("[class*='share-button_share-button'], .banner-button")
      ) {
        cancelMessage = msg("share");
      } else if (addon.settings.get("followinguser") && e.target.closest("#profile-data .follow-button")) {
        cancelMessage = msg("follow");
      } else if (addon.settings.get("joiningstudio") && e.target.closest("a.accept")) {
        cancelMessage = msg("joinstudio");
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
