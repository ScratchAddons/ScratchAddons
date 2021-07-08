export default async function ({ addon, console }) {
  addon.tab.waitForElement("#navigation .login-item").then(() => {
    addon.tab.waitForElement(".studio-page").then((page) => {
      page.classList.add("sa-oldstudio-logged-out");
      addon.tab.waitForElement("#navigation .account-nav").then(() => {
        /* user signed back in - this is possible without reloading the page */
        addon.tab.waitForElement(".studio-page").then((page) => {
          page.classList.remove("sa-oldstudio-logged-out");
        });
      });
    });
  });
  addon.tab.waitForElement(".studio-follow-button").then((followButton) => {
    followButton.parentElement.classList.add("sa-oldstudio-follow-section");
  });
}
