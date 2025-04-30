export default async function ({ addon, console, msg }) {
  function wrapAddAssetAndSelectName(originalFn, type) {
    return function (...args) {
      // `this` is a VirtualMachine

      if (!addon.self.disabled && addon.settings.get("auto-select"))
        (async () => {
          // Select the backdrop editor if it was created with the button at the bottom right
          if (type === "backdrop") {
            this.setEditingTarget(this.runtime.getTargetForStage().id);
            addon.tab.redux.dispatch({ type: "scratch-gui/navigation/ACTIVATE_TAB", activeTabIndex: 1 });
          }

          // Compatibility with sprite-properties, show properties
          else if (type === "sprite") {
            document.querySelector("body:not(.sa-show-sprite-properties) .sa-sprite-properties-info-btn")?.click();
          }

          let selector;
          if (type === "sprite") selector = '[class*="sprite-info_sprite-input_"]';
          else if (type === "sound") selector = '[class*="sound-editor_input-group_"] [class*="input_input-form_"]';
          else selector = '[class*="paint-editor_row_"] [class*="input_input-form_"]';
          const input = await addon.tab.waitForElement(selector, { markAsSeen: false });

          // Wait for the input value to be changed before selecting it
          const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
          Object.defineProperty(input, "value", {
            set(value) {
              originalDescriptor.set.call(this, value);
              Object.defineProperty(input, "value", originalDescriptor);

              setTimeout(() => {
                input.select();
              });
            },
            get() {
              return originalDescriptor.get.call(this);
            },
          });
        })();

      return originalFn.call(this, ...args);
    };
  }

  const vm = addon.tab.traps.vm;
  vm.addCostume = wrapAddAssetAndSelectName(vm.addCostume, "costume");
  vm.addSound = wrapAddAssetAndSelectName(vm.addSound, "sound");
  vm.addBackdrop = wrapAddAssetAndSelectName(vm.addBackdrop, "backdrop");
  vm.addSprite = wrapAddAssetAndSelectName(vm.addSprite, "sprite");
}
