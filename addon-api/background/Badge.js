/**
 * Represents badge.
 */
export default class Badge {
  constructor(addonObject) {
    this._addonId = addonObject.self.id;
    this._text = null;
    this._color = null;
    scratchAddons.localState.badges[this._addonId] = {
      text: null,
      color: null,
    };
  }
  /**
   * Text shown on the badge.
   * @type {?string}
   */
  get text() {
    return this._text;
  }
  /**
   * Color of the badge.
   * @type {?string}
   */
  get color() {
    return this._color;
  }
  set text(val) {
    this._text = val;
    scratchAddons.localState.badges[this._addonId].text = val;
  }
  set color(val) {
    this._color = val;
    scratchAddons.localState.badges[this._addonId].color = val;
  }
}
