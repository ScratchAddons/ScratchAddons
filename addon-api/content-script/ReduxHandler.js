import Listenable from "../common/Listenable.js";

/** Handles Redux state. */
export default class ReduxHandler extends Listenable {
  constructor() {
    super();
    /** @type {boolean} Whether The handler is initialized or not. */
    this.initialized = false;
    this.initialize();
  }

  /** Initialize the handler. Must be called before adding events. */
  initialize() {
    if (!__scratchAddonsRedux.target || this.initialized) return;
    this.initialized = true;
    __scratchAddonsRedux.target.addEventListener("statechanged", ({ detail }) => {
      const newEvent = new CustomEvent("statechanged", {
        detail: {
          action: detail.action,
          prev: detail.prev,
          next: detail.next,
        },
      });
      this.dispatchEvent(newEvent);
    });
  }

  /** Redux state. */
  get state() {
    return __scratchAddonsRedux.state;
  }

  /**
   * Dispatches redux state change.
   *
   * @param {{
   *   [key: string]: any;
   *   type: string;
   * }} payload
   * @throws When Redux is unavailable.
   */
  dispatch(payload) {
    if (!__scratchAddonsRedux.dispatch) throw new Error("Redux is unavailable");
    __scratchAddonsRedux.dispatch(payload);
  }
}
