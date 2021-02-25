export default function ({ addon, global, console }) {
  let interval, injected;

  addon.self.addEventListener("disabled", () => clearInterval(interval));
  addon.self.addEventListener("reenabled", () => !injected && tryInjecting());

  // TODO: this makes the function work normally when the addon is disabled,
  // but "share the love" stays broken for a while after disabling/reenabling.
  // We should consider not providing no-refresh-disable for an addon, or
  // somehow force Blockly to call this function again.
  const inject = (workspace) => {
    injected = true;
    const originalGetClientRect = workspace.toolbox_.getClientRect;
    workspace.toolbox_.getClientRect = function () {
      // we are trying to undo the effect of BIG_NUM in https://github.com/LLK/scratch-blocks/blob/ab26fa2960643fa38fbc7b91ca2956be66055070/core/flyout_vertical.js#L739
      const rect = originalGetClientRect.call(this);
      if (!rect || addon.self.disabled) return rect;
      if (rect.left > 0) return rect;
      rect.left += 1000000000;
      rect.width -= 1000000000;
      return rect;
    };
  };

  function tryInjecting() {
    if (addon.tab.editorMode === "editor") {
      interval = setInterval(() => {
        if (Blockly.getMainWorkspace()) {
          inject(Blockly.getMainWorkspace());
          clearInterval(interval);
        }
      }, 100);
    }

    addon.tab.addEventListener("urlChange", () => {
      if (addon.tab.editorMode === "editor") {
        // Inject even if addon is disabled, will pollute but not change function return value
        inject(Blockly.getMainWorkspace());
      }
    });
  }
  tryInjecting();
}
