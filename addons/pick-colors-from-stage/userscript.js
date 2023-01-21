export default async function ({ addon, msg, console }) {
  const brand = Symbol();

  const setIsPicking = (picking) => document.body.classList.toggle("sa-stage-color-picker-picking", picking);

  // We only want to handle color picker events from the user clicking on the button, not from
  // addons or other scripts pressing it with click().
  let isMostRecentClickUserInitiated = false;
  document.addEventListener(
    "click",
    (e) => {
      isMostRecentClickUserInitiated = e.isTrusted;
    },
    {
      capture: true,
    }
  );

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    const action = e.detail.action;

    // Do not process events emitted by ourselves.
    if (action[brand]) {
      return;
    }

    if (
      !addon.self.disabled &&
      isMostRecentClickUserInitiated &&
      action.type === "scratch-paint/eye-dropper/ACTIVATE_COLOR_PICKER"
    ) {
      setIsPicking(true);

      // When scratch-paint's color picker is activated, also activate scratch-gui's color picker.
      addon.tab.redux.dispatch({
        type: "scratch-gui/color-picker/ACTIVATE_COLOR_PICKER",
        callback: (color) => {
          // callback is called from reducer; do not dispatch events in reducer
          queueMicrotask(() => {
            // By the time we get here, scratch-paint will have already deactivated its eye dropper.
            // If we were to just call the callback, the color would indeed update, but the sliders
            // in the color selector would not update.
            // https://github.com/LLK/scratch-paint/blob/970b72c3e75d0ad44ab54e403a44786ca5f45512/src/containers/color-picker.jsx#L64
            // To work around this, we will re-enable the color picker before running the callback.
            addon.tab.redux.dispatch({
              ...action,
              [brand]: true,
            });
            action.callback(color);
            if (action.previousMode) {
              action.previousMode.activate();
            }
            addon.tab.redux.dispatch({
              type: "scratch-paint/eye-dropper/DEACTIVATE_COLOR_PICKER",
              [brand]: true,
            });
            setIsPicking(false);
          });
        },
      });
    }

    // Don't check for addon being disabled here in case we were dynamically disabled while color
    // picking. This code won't do anything anyways when the previous code doesn't run.
    if (action.type === "scratch-paint/eye-dropper/DEACTIVATE_COLOR_PICKER") {
      setIsPicking(false);

      // When someone selects a color in the scratch-paint picker, cancel the scratch-gui picker
      if (addon.tab.redux.state.scratchGui.colorPicker.active) {
        addon.tab.redux.dispatch({
          type: "scratch-gui/color-picker/DEACTIVATE_COLOR_PICKER",
          [brand]: true,
        });
      }
    }
  });
}
