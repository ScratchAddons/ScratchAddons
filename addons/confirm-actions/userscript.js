export default async function ({ addon, console, msg }) {
  if (addon.settings.get("projectsharing"))
    actionAlert("[class*='share-button_share-button'], .banner-button", msg("share"));
  if (addon.settings.get("followinguser")) actionAlert("div.follow-button", msg("follow"));
  if (addon.settings.get("joiningstudio")) actionAlert("a.accept", msg("joinstudio"));
  async function actionAlert(queryButton, res) {
    while (true) {
      let button = await addon.tab.waitForElement(queryButton, { markAsSeen: true });
      let canAction = false;
      button.addEventListener("click", function (e) {
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
