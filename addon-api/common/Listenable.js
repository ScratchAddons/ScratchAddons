/**
 * Wrapper class for EventTarget.
 * @extends EventTarget
 */
export default class Listenable extends EventTarget {
  constructor(...args) {
    super(...args);
    if (this._eventTargetKey !== null) {
      scratchAddons.eventTargets[this._eventTargetKey].push(this);
    }
  }

  /**
   * @private
   */
  dispatchEvent(...args) {
    return super.dispatchEvent(...args);
  }

  /**
   * If the subclass removes stale references using dispose(),
   * this key will be used.
   * @type {?string}
   * @private
   */
  get _eventTargetKey() {
    return null;
  }

  /**
   * Destructor of this instance.
   * @private
   */
  dispose() {
    const key = this._eventTargetKey;
    if (key === null) return;
    scratchAddons.eventTargets[key].splice(
      scratchAddons.eventTargets[key].findIndex((x) => x === this),
      1
    );
  }
}
