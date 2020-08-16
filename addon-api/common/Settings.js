export default class Settings extends EventTarget {
  constructor(addonObject) {
    super();
    this._addonId = addonObject.self.id;
    scratchAddons.eventTargets.settings.push(this);
  }
  get(optionName) {
    return scratchAddons.globalState.addonSettings[this._addonId][optionName];
  }
  _removeEventListeners() {
    scratchAddons.eventTargets.settings.splice(
      scratchAddons.eventTargets.settings.findIndex((x) => x === this),
      1
    );
  }
}
