import Listenable from "../common/Listenable.js";

/**
 * Handles Redux state.
 * @extends Listenable
 * @property {boolean} initialized Whether the handler is initialized or not.
 */
export default class ReduxHandler extends Listenable {
  constructor() {
    super();
    this.initialized = false;
    this.initialize();
  }

  /**
   * Initialize the handler. Must be called before adding events.
   */
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

  /**
   * Redux state.
   * @type {object}
   */
  get state() {
    return __scratchAddonsRedux.state;
  }

  /**
   * Dispatches redux state change.
   * @param {object} payload - payload to pass to redux.
   * @throws when Redux is unavailable.
   */
  dispatch(payload) {
    if (!__scratchAddonsRedux.dispatch) throw new Error("Redux is unavailable");
    __scratchAddonsRedux.dispatch(payload);
  }
}
