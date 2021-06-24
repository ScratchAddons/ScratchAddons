/** Represents the badge. */
export default class Badge {
  /** @param {import("Addon.js").default} addonObject */
  constructor(addonObject) {
    /** @private */
    this._addonId = addonObject.self.id;
    /** @private */
    this._text = null;
    /** @private */
    this._color = null;
    if (!scratchAddons.localState) throw new TypeError("localState is nor defined")
    scratchAddons.localState.badges[this._addonId] = {
      text: null,
      color: null,
    };
  }
  /**
   * Text shown on the badge.
   *
   * @type {string | null}
   */
  get text() {
    return this._text;
  }
  /**
   * Color of the badge.
   *
   * @type {string | null}
   */
  get color() {
    return this._color;
  }
  /** @param {any} val */
  set text(val) {
    val = typeof val === "string" || !val ? val : `${val}`;
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
