export default function ({ addon, global, console }) {
  let interval, injected;
  console.log(addon.self);
  addon.self.addEventListener("addonDisabled", () => clearInterval(interval));
  addon.self.addEventListener("addonReeabled", () => injected ? 0 : tryInjecting());

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

    addon.tab.bindListener(
      addon.tab,
      "urlChange",
      () => addon.tab.editorMode === "editor" && inject(Blockly.getMainWorkspace())
    );
  }
  tryInjecting();
}
