import Listenable from "../common/Listenable.js";

/** Handles Redux state. */
export default class ReduxHandler extends Listenable {
  constructor() {
    super();
    /**
     * Whether the handler is initialized or not.
     *
     * @type {boolean}
     */
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

  /**
   * Redux state.
   *
   */
  get state() {
    return __scratchAddonsRedux.state;
  }

  /**
   * Dispatches redux state change.
   *
   * @param payload - Payload to pass to redux.
   * @throws When Redux is unavailable.
   */
  dispatch(payload) {
    if (!__scratchAddonsRedux.dispatch) throw new Error("Redux is unavailable");
    __scratchAddonsRedux.dispatch(payload);
  }

  /**
   * Waits until a state meets the condition.
   *
   * @param {(state)=>boolean} condition - A function that takes redux state and returns whether to keep waiting or not.
   * @param {object} [opts] - Options.
   * @param {string|string[]} [opts.actions] - The action(s) to check for.
   *
   * @returns {Promise<void>} A Promise resolved when the state meets the condition.
   */
  waitForState(condition, opts = {}) {
    this.initialize();
    if (!__scratchAddonsRedux.target) return Promise.reject(new Error("Redux is unavailable"));
    if (condition(__scratchAddonsRedux.state)) return Promise.resolve();
    let actions = opts.actions || null;
    if (typeof actions === "string") actions = [actions];
    return new Promise((resolve) => {
      const listener = ({ detail }) => {
        if (actions && !actions.includes(detail.action.type)) return;
        if (!condition(detail.next)) return;
        __scratchAddonsRedux.target.removeEventListener("statechanged", listener);
        setTimeout(resolve, 0);
      };
      __scratchAddonsRedux.target.addEventListener("statechanged", listener);
    });
  }
}
