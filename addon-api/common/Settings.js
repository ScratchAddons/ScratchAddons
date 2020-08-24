export default class Settings extends EventTarget {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
    scratchAddons.eventTargets.settings.push(this);
  }
  get(optionName) {
    const settingsObj = scratchAddons.globalState.addonSettings[this._addonId] || {};
    const value = settingsObj[optionName];
    if (value === undefined) throw "ScratchAddons exception: invalid setting ID";
    else return value;
  }
  _removeEventListeners() {
    scratchAddons.eventTargets.settings.splice(
      scratchAddons.eventTargets.settings.findIndex((x) => x === this),
      1
    );
  }
}
