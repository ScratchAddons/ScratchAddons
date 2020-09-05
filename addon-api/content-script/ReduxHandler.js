export default class ReduxHandler extends EventTarget {
  constructor() {
    super();
    if (!__scratchAddonsRedux.target) return;
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
   * @type {object} redux state
   */
  get state() {
    return __scratchAddonsRedux.state;
  }

  /**
   * Dispatches redux state change.
   * @param {object} payload payload to pass to redux.
   */
  dispatch(payload) {
    if (!__scratchAddonsRedux.dispatch) throw new Error("Redux is unavailable");
    __scratchAddonsRedux.dispatch(payload);
  }
}
