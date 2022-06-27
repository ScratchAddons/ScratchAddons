function injectRedux() {
  window.__scratchAddonsRedux = {};
  if (typeof window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ !== "undefined") {
    return console.warn(
      "Redux feature is disabled due to conflict. \
Some addons will not work. Uninstall other browser extensions to \
fix this warning."
    );
  }

  // ReDucks: Redux ducktyped
  // Not actual Redux, but should be compatible
  class ReDucks {
    static compose(...composeArgs) {
      if (composeArgs.length === 0) return (...args) => args;
      return (...args) => {
        const composeArgsReverse = composeArgs.slice(0).reverse();
        let result = composeArgsReverse.shift()(...args);
        for (const fn of composeArgsReverse) {
          result = fn(result);
        }
        return result;
      };
    }

    static applyMiddleware(...middlewares) {
      return (createStore) =>
        (...createStoreArgs) => {
          const store = createStore(...createStoreArgs);
          let { dispatch } = store;
          const api = {
            getState: store.getState,
            dispatch: (action) => dispatch(action),
          };
          const initialized = middlewares.map((middleware) => middleware(api));
          dispatch = ReDucks.compose(...initialized)(store.dispatch);
          return Object.assign({}, store, { dispatch });
        };
    }
  }

  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ = function (...args) {
    const scratchAddonsRedux = window.__scratchAddonsRedux;
    const reduxTarget = (scratchAddonsRedux.target = new EventTarget());
    scratchAddonsRedux.state = {};
    scratchAddonsRedux.dispatch = () => {};

    function middleware({ getState, dispatch }) {
      scratchAddonsRedux.dispatch = dispatch;
      scratchAddonsRedux.state = getState();
      return (next) => (action) => {
        const nextReturn = next(action);
        const ev = new CustomEvent("statechanged", {
          detail: {
            prev: scratchAddonsRedux.state,
            next: (scratchAddonsRedux.state = getState()),
            action,
          },
        });
        reduxTarget.dispatchEvent(ev);
        return nextReturn;
      };
    }
    args.splice(1, 0, ReDucks.applyMiddleware(middleware));
    return ReDucks.compose.apply(this, args);
  };
}

if (!(document.documentElement instanceof SVGElement)) {
  const injectReduxScript = document.createElement("script");
  injectReduxScript.append(document.createTextNode("(" + injectRedux + ")()"));
  (document.head || document.documentElement).appendChild(injectReduxScript);
}
