import Auth from "../common/Auth.js";
import Account from "../common/Account.js";
import fetch from "../common/fetch.js";
import Tab from "./Tab.js";
import Settings from "../common/Settings.js";

export default class Addon {
  constructor(info) {
    const { id } = info;
    const path = document.getElementById("scratch-addons").getAttribute("data-path");
    this.self = {
      id,
      dir: `${path}addons/${id}`,
      browser: typeof InstallTrigger !== "undefined" ? "firefox" : "chrome",
      lib: `${path}libraries`,
    };
    this.auth = new Auth(this);
    this.account = new Account();
    this.fetch = fetch;
    this.tab = new Tab(info);
    this.settings = new Settings(this);
  }
}
