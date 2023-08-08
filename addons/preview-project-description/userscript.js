export default async function ({ addon, console, msg }) {
  const enableSwitcher = document.createElement("button");
  const enableSwitcherText = document.createElement("span");
  enableSwitcher.id = "sa-preview-notes-instructions";
  enableSwitcher.classList.add("button", "action-button", "sa-preview-desc");
  enableSwitcher.addEventListener("click", () => togglePreview());
  enableSwitcher.appendChild(enableSwitcherText);

  let currentlyEnabled = false;
  let wasEverEnabled = false;
  let currentlyRerendering = false;

  let avoidInfiniteLoops = 0; // Just in case, make sure we aren't introducing an infinite loop (unsure if Redux considers this)
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    // We don't want a state change to disable the preview mode.
    if (!addon.tab.redux.state.scratchGui.mode.isPlayerOnly) return;
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

  while (true) {
    // Same waitForElement call as animated-thumb/userscript.js
    await addon.tab.waitForElement(".flex-row.subactions > .flex-row.action-buttons", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });

    // Skip if user cannot edit the project title.
    // Same logic as animated-thumb/userscript.js
    if (!document.querySelector(".form-group.project-title")) continue;

    addon.tab.appendToSharedSpace({
      space: "afterCopyLinkButton",
      order: 1,
      element: enableSwitcher,
    });
    togglePreview(false);
    currentlyEnabled = false;
  }

  /**
   * Will attempt to toggle between the off and on states, however an override can be passed
   * which will completely override the current value
   * @param {boolean} override Force to a specific value.
   * @returns {void}
   */
  function togglePreview(override = !currentlyEnabled) {
    const oldCurentlyEnabled = currentlyEnabled;
    enableSwitcherText.innerText = override ? msg("Disable") : msg("Enable");
    currentlyEnabled = override;

    if (currentlyEnabled === true && !wasEverEnabled) {
      wasEverEnabled = true;
      addTraps();
    }

    if (oldCurentlyEnabled === false && currentlyEnabled === true) {
      enablePreview();
    }

    if (oldCurentlyEnabled === true && currentlyEnabled === false) {
      forceReactRerender();
    }
  }

  function enablePreview() {
    currentlyRerendering = true;
    forceReactRerender();
    currentlyRerendering = false;

    if (!document.querySelector(".project-description")) {
      // Something went wrong for some reason...
      console.log("Failed to show preview of project notes.");
    }
  }

  function forceReactRerender() {
    // We dispatch some Redux update to force React to rerender.
    // This will call the function mapStateToProps (scratch-www/src/views/preview/project-view.jsx) again.
    addon.tab.redux.dispatch({
      type: "SET_FETCH_STATUS",
      infoType: "parent",
      status: addon.tab.redux.state.preview.status.parent, // We do not actually change anything here.
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
          console.trace("Returning a fake username to mapStateByProps");
          return "";
        }
        return Reflect.get(target, property, receiver);
      },
    });
  }
}
