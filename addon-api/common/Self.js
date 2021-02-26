import Listenable from "./Listenable.js";

/**
 * @extends Listenable
 */
export default class Self extends Listenable {
  constructor(addonObj, info) {
    super();
    this._addonId = info.id; // In order to receive fireEvent messages from background
    this.id = info.id;
    this._addonObj = addonObj;
    this.browser = typeof InstallTrigger !== "undefined" ? "firefox" : "chrome";
    this.disabled = false;
    this.addEventListener("disabled", () => (this.disabled = true));
    this.addEventListener("reenabled", () => (this.disabled = false));
    console.log(this.id, "has seen this!");
    // this.addEventListener("message", (event) => {
    //   console.log("WHOW CRAZY MAN", event);
    // });
  }
  sendMessage(msg, data = {}) {
    const { scope } = data;
    const sending = {
      target: "self",
      name: "message",
      data: { msg, scope },
      filter: (addon) => console.log(addon)
    }
    this._template.setAttribute(`data-fire-event__${Date.now()}`, JSON.stringify(sending));
  }

  get _template() {
    return document.querySelector("#scratch-addons");
  }

  get dir() {
    return `${this._addonObj._path}addons/${this.id}`;
  }

  get lib() {
    return `${this._addonObj._path}libraries`;
  }

  /**
   * @private
   */
  get _eventTargetKey() {
    return "self";
  }
}
