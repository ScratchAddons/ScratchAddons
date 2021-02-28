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
    this.addEventListener("message", (event) => {
      const data = {
        UserscriptAddon: "user",
        BackgroundScriptAddon: "persistent"
      }
      if ((event.detail.scope || []).includes(data[this._addonObj.constructor.name])) {
        for (const func of this._msgFunctions) {
          func.call(this, event.detail.msg);
        }        
      }
    });
    this._msgFunctions = [];
  }
  sendMessage(msg, data = {}) {
    const { addonId, scope } = data;
    const sending = {
      target: "self",
      name: "message",
      addonId,
      data: { msg, scope }
    };
    if (this._template) { // CS
      this._template.setAttribute(`data-fire-event__${Date.now()}`, JSON.stringify(sending));
    } else { // PS
      chrome.tabs.query({}, (tabs) =>
        tabs.forEach(
          (tab) =>
            (tab.url || (!tab.url && typeof browser !== "undefined")) &&
            chrome.tabs.sendMessage(tab.id, {
              fireEvent: {
                target: "self",
                name: "message",
                addonId,
                data: { msg, scope }
              },
            })
        )
      );
    }
  }
  onMessage(func) {
    this._msgFunctions.push(func);
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
