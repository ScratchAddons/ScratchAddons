import { disableTabs } from "../project-notes-tabs/disable-self.js";

/** @typedef {import("types").Types} Types @param {Types} */
export default async function ({ addon, console, msg }) {
  const divElement = Object.assign(document.createElement("div"), {
    className: "sa-toggle-project-preview",
  });
  const span = Object.assign(document.createElement("span"), {
    textContent: msg("preview"),
  });
  const label = Object.assign(document.createElement("label"), {
    className: "toggle-switch",
  });
  const checkboxInput = Object.assign(document.createElement("input"), {
    type: "checkbox",
  });
  const sliderSpan = Object.assign(document.createElement("span"), {
    className: "slider",
  });
  label.append(checkboxInput, sliderSpan);
  divElement.append(span, label);

  addon.tab.displayNoneWhileDisabled(divElement, { display: "flex" });
  addon.self.addEventListener("disabled", () => {
    togglePreview(false);
    checkboxInput.checked = false;
  });

  checkboxInput.addEventListener("change", () => {
    togglePreview(checkboxInput.checked);
  });

  let currentlyEnabled = false;
  let wasEverEnabled = false;
  let currentlyRerendering = false;

  // We don't want to introduce infinite loops, if a statechanged event by itself changes state.
  let avoidInfiniteLoops = 0;
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    // We don't want a state change to disable the preview mode.
    if (!addon.tab.redux.state.scratchGui.mode.isPlayerOnly) return;
    if (e.detail.action._saProjectDescription) return;
    if (avoidInfiniteLoops > 5) console.log("Avoiding an infinite loop");
    else if (currentlyEnabled) {
      const num = ++avoidInfiniteLoops;
      // Restore preview mode.
      queueMicrotask(() => enablePreview());
      setTimeout(() => {
        if (avoidInfiniteLoops === num) avoidInfiniteLoops = 0;
      }, 0);
    }
  });

  async function injectToggle() {
    // Remove our element if it's already on the page
    // This is to ensure the toggle is always next to "instructions" when editing.
    divElement.remove();

    if (!wasEverEnabled) {
      // TODO: also change animated-thumb/userscript.js (or create new utility)
      const loggedInUser = await addon.auth.fetchUsername();
      const projectOwner = addon.tab.redux.state?.preview?.projectInfo?.author?.username;
      if (!projectOwner || !loggedInUser || loggedInUser !== projectOwner) {
        return;
      }
    }

    if (document.querySelector(".sa-project-tabs-wrapper")) {
      // Since project-notes-tabs runs on runAtComplete:false, and doesn't support
      // dynamicEnable, it's very unlikely that it hasn't executed yet.
      // Worst that can happen is that the "preview" toggle isn't accessible until a reload.
      document.querySelector(".sa-project-tabs-wrapper").appendChild(divElement);
    } else {
      document.querySelector(".project-notes > .description-block > .project-textlabel").append(divElement);
    }
  }

  while (true) {
    await addon.tab.waitForElement(".project-notes, .project-description", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });

    injectToggle();
  }

  /**
   * Will attempt to toggle between the off and on states, however an override can be passed
   * which will completely override the current value
   * @param {boolean} override Force to a specific value.
   * @returns {void}
   */
  function togglePreview(override = !currentlyEnabled) {
    const oldCurentlyEnabled = currentlyEnabled;
    currentlyEnabled = override;

    if (currentlyEnabled === true && !wasEverEnabled) {
      wasEverEnabled = true;
      addTraps();
    }

    if (oldCurentlyEnabled === false && currentlyEnabled === true) {
      enablePreview();
    }

    if (oldCurentlyEnabled === true && currentlyEnabled === false) {
      // Disabling the preview is as simple as forcing a React
      // rerender with the traps off.
      forceReactRerender();
      // This case will not cause waitForElement to fire.
      // Manually run the injectToggle() function:
      queueMicrotask(injectToggle);
    }
  }

  async function enablePreview() {
    if (document.body.classList.contains("sa-project-tabs-on")) {
      // Disable the project-notes-tabs addon if it's enabled.
      disableTabs();

      injectToggle();

      // Just in case, wait 1 event loop cycle
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    currentlyRerendering = true;
    forceReactRerender();
    currentlyRerendering = false;

    if (!document.querySelector(".project-description")) {
      // Something went wrong for some reason...
      console.log("Failed to show preview of project notes.");
      checkboxInput.checked = false;
      currentlyEnabled = false;
    }
  }

  function forceReactRerender() {
    // We dispatch some Redux update to force React to rerender.
    // This will call the function mapStateToProps (scratch-www/src/views/preview/project-view.jsx) again.
    addon.tab.redux.dispatch({
      type: "SET_FETCH_STATUS",
      infoType: "parent",
      status: addon.tab.redux.state.preview.status.parent, // We do not actually change anything here.
      _saProjectDescription: true,
    });
  }

  function addTraps() {
    const { redux } = addon.tab;

    const beingCalledByMapStateToProps = () => {
      // We want to know if we're being called from function mapStateToProps (scratch-www/src/views/preview/project-view.jsx)
      // That function declares a variable `isEditable` which determines whether the user can edit the project notes or not.
      // The mapStateToProps function is then passed to Redux's "connect" utility and the return value of the connect() call
      // is exported as module.exports.View: https://github.com/scratchfoundation/scratch-www/blob/59fa9cd12744ec6fcfc73d0d92c4fbbe5ca73d38/src/views/preview/project-view.jsx#L1213
      try {
        const stack = new Error().stack;
        // In Firefox, `View` is part of the call stack returned with new Error().stack, so we just check if it's there.
        // In Chrome, `View` is not listed, so instead we look for `Function.mapToProps`, which is internally used by Redux's
        // connect() implementation: https://github.com/reduxjs/react-redux/blob/v5.0.7/src/connect/wrapMapToProps.js#L43
        return Boolean(
          stack
            .split("\n")
            .slice(0, 4) // No need to look deeper than 4 lines of the error stack.
            .find((s) => s.trimStart().startsWith("at Function.mapToProps ") || s.startsWith("e.exports.View"))
        );
      } catch {
        // Not sure if anything could theoretically throw inside the "try", but let's be careful
        return false;
      }
    };

    let step = 0;
    // https://github.com/scratchfoundation/scratch-www/blob/59fa9cd12744ec6fcfc73d0d92c4fbbe5ca73d38/src/views/preview/project-view.jsx#L1028
    // 1. A call to author.id.toString() with a matching function stack.
    // 2. A call to state.session.user.id.toString() with a matching function stack (author ID = user ID).
    // 3. A getter to `state.session.session.user.username` on the same event loop cycle. Reset to step 0.

    const originalNumberToString = Number.prototype.toString;
    Number.prototype.toString = function (...args) {
      if (!currentlyRerendering) return originalNumberToString.apply(this, args);
      if (this !== redux.state?.session?.session?.user?.id) return originalNumberToString.apply(this, args);
      if (!beingCalledByMapStateToProps()) return originalNumberToString.apply(this, args);

      step++;
      if (step === 3) {
        // Huh, weird
        step = 0;
        return originalNumberToString.apply(this, args);
      }

      queueMicrotask(() => (step = 0));

      return originalNumberToString.apply(this, args);
    };

    // The `isEditable` variable is declared as follows: (scratch-www/src/views/preview/project-view.jsx)
    //   isEditable = isLoggedIn && (authorUsername === state.session.session.user.username || state.permissions.admin === true)
    // The idea is to modify the Redux state object so that `state.session.session.user.username` is actually different from
    // the project author, making the expression `false`. However, actually modifying Redux state can cause issues, so instead
    // we use a Proxy to return a fake username just for this getter call.
    redux.state.session.session.user = new Proxy(redux.state.session.session.user, {
      get(target, property, receiver) {
        if (!currentlyRerendering || property !== "username") {
          // In these cases, proxy but do nothing different.
          return Reflect.get(target, property, receiver);
        }

        if (step === 2 && beingCalledByMapStateToProps()) {
          // Return an empty string, which will not be equal to `authorUsername`, turning `isEditable` into `false`.
          step = 0;
          console.groupCollapsed("[SA] preview-project-description [page]");
          console.trace("Returning a fake username to mapStateByProps");
          console.groupEnd();
          return "";
        }

        return Reflect.get(target, property, receiver);
      },
    });
  }
}
