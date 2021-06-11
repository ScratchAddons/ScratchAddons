export default async function ({ addon, global, console }) {
  const mainJS = await addon.tab.waitForElement("script[src$=\"js/apps/userprofile/main.js\"]");
  mainJS.addEventListener("load", () => {
    const init = Scratch.UserProfile.Router.prototype.initialize;
    Scratch.UserProfile.Router.prototype.initialize = function (...args) {
      const v = init.call(this, ...args);
      this.profileModel.related.shared.options.collectionType = this.profileModel.related.shared._meta.collectionType = "all/#";
      return v;
    }
  }, { once: true });
}
