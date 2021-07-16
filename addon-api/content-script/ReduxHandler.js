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

  /**
   * Waits until a state meets the condition.
   * @param {function} condition - a function that takes redux state and returns whether to keep waiting or not.
   * @param {object=} opts - options.
   * @param {string=|string[]=} actions - the action(s) to check for.
   * @returns {Promise} a Promise resolved when the state meets the condition.
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
