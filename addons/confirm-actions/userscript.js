export default async function ({ addon, console }) {
  if (addon.settings.get("projectsharing")) actionAlert("[class*='share-button_share-button'], .banner-button", "Are you sure you want to share?");
  if (addon.settings.get("followinguser")) actionAlert(".follow-button", "Are you sure you want to follow/unfollow this user?");
  if (addon.settings.get("joiningstudio")) actionAlert("a.accept", "Are you sure you would like to join this studio?");
  async function actionAlert(queryButton, res) {
    while (true) {
      let button = await addon.tab.waitForElement(queryButton, { markAsSeen: true });
      let canAction = false;
      button.addEventListener("click", function (e) {
        if (!canAction) {
          e.cancelBubble = true;
          e.preventDefault();
          if (confirm("Scratch Addons:\n" + res)) {
            canAction = true;
            button.click();
          }
        } else canAction = false;
      });
    }
  }
}
