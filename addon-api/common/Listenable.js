/** Wrapper class for EventTarget. */
export default class Listenable extends EventTarget {
  constructor() {
    super();
    if (this._eventTargetKey !== null) {
      scratchAddons.eventTargets[this._eventTargetKey]?.push(this);
    }
  }

  /** @param {Event} event */
  dispatchEvent(event) {
    return super.dispatchEvent(event);
  }

  /**
   * If the subclass removes stale references using dispose(), this key will be used.
   *
   * @type {"auth" | "settings" | "self" | "tab" | null}
   */
  get _eventTargetKey() {
    return null;
  }

  /** Destructor of this instance. */
  dispose() {
    const key = this._eventTargetKey;
    if (key === null) return;
    scratchAddons.eventTargets[key]?.splice(scratchAddons.eventTargets[key]?.findIndex((x) => x === this) ?? 0, 1);
  }
}
