export default async function ({ addon, console, msg }) {
  actionAlert("projectsharing", "[class*='share-button_share-button'], .banner-button", msg("share"));
  actionAlert("followinguser", "#profile-data .follow-button", msg("follow"));
  actionAlert("joiningstudio", "a.accept", msg("joinstudio"));
  async function actionAlert(setting, queryButton, res) {
    while (true) {
      let button = await addon.tab.waitForElement(queryButton, { markAsSeen: true });
      let canAction = false;
      button.addEventListener("click", function (e) {
        if (addon.self.disabled || !addon.settings.get(setting)) return;
        if (!canAction) {
          e.cancelBubble = true;
          e.preventDefault();
          if (confirm(res)) {
            canAction = true;
            button.click();
          }
        } else canAction = false;
      });
    }
  }
}
