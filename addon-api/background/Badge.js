export default class Badge {
  constructor(addonsObject) {
    this._addonId = addonsObject.self.id;
    this._text = null;
    this._color = null;
    scratchAddons.localState.badges[this._addonId] = {
      text: null,
      color: null,
    };
  }
  get text() {
    return this._text;
  }
  get color() {
    return this._color;
  }
  set text(val) {
    let realVal = val;
    if (val === null || val === 0) realVal = "";
    else if (typeof val === "number") realVal = String(val);
    this._text = val;
    scratchAddons.localState.badges[this._addonId].text = realVal;
    chrome.browserAction.setBadgeText({ text: realVal });
  }
  set color(val) {
    this._color = val;
    scratchAddons.localState.badges[this._addonId].color = val;
    chrome.browserAction.setBadgeBackgroundColor({ color: val });
  }
  // TODO: handle badges elsewhere to allow many addons to use it. move realVal logic there.
}
