/** @file Represents Badge. */

export default class Badge {
  /** @param {import("Addon.js").default} addonObject */
  constructor(addonObject) {
    this._addonId = addonObject.self.id;
    this._text = undefined;
    this._color = undefined;
    scratchAddons.localState.badges[this._addonId] = {
      text: undefined,
      color: undefined,
    };
  }
  /**
   * Text shown on the badge.
   *
   * @type {string | undefined}
   */
  get text() {
    return this._text;
  }
  /**
   * Color of the badge.
   *
   * @type {string | undefined}
   */
  get color() {
    return this._color;
  }
  set text(val) {
    this._text = val;
    //@ts-expect-error -- The constructor ensures it is not undefined.
    scratchAddons.localState.badges[this._addonId].text = val;
  }
  set color(val) {
    this._color = val;
    //@ts-expect-error -- The constructor ensures it is not undefined.
    scratchAddons.localState.badges[this._addonId].color = val;
  }
}
