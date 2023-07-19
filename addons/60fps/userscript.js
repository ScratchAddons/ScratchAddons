export default async function ({ addon, console }) {
  // TODO: test whether e.altKey is true in chromebooks when alt+clicking.
  // If so, no timeout needed, similar to mute-project addon.

  let global_fps = 30;
  const vm = addon.tab.traps.vm;
  let mode = false;
  let monitorUpdateFixed = false;

  // Flag svg URIs
  // Would be nice TODO: Get the flag svg URIs from the scratch html.
  let fastFlag =
    "data:image/svg+xml,<svg viewBox='0 0 17 18' fill='none' xmlns='http://www.w3.org/2000/svg'><g clip-path='url(%23clip0_0_3)'><path d='M0.75 2C1.8613 1.1729 3.20969 0.726196 4.595 0.726196C5.98031 0.726196 7.3287 1.1729 8.44 2C9.5513 2.8271 10.8997 3.27381 12.285 3.27381C13.6703 3.27381 15.0187 2.8271 16.13 2V12.4C15.0187 13.2271 13.6703 13.6738 12.285 13.6738C10.8997 13.6738 9.5513 13.2271 8.44 12.4C7.3287 11.5729 5.98031 11.1262 4.595 11.1262C3.20969 11.1262 1.8613 11.5729 0.75 12.4' fill='%234CBF56'/><path d='M0.75 2C1.8613 1.1729 3.20969 0.726196 4.595 0.726196C5.98031 0.726196 7.3287 1.1729 8.44 2C9.5513 2.8271 10.8997 3.27381 12.285 3.27381C13.6703 3.27381 15.0187 2.8271 16.13 2V12.4C15.0187 13.2271 13.6703 13.6738 12.285 13.6738C10.8997 13.6738 9.5513 13.2271 8.44 12.4C7.3287 11.5729 5.98031 11.1262 4.595 11.1262C3.20969 11.1262 1.8613 11.5729 0.75 12.4' stroke='%2345993D' stroke-linecap='round' stroke-linejoin='round'/><path d='M0.75 16.75V0.75' stroke='%2345993D' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/><path d='M9.60727 12.4029L4.04607 16.4893C3.71586 16.732 3.25 16.4962 3.25 16.0864L3.25 7.91358C3.25 7.50381 3.71586 7.26802 4.04607 7.51066L9.60727 11.5971C9.87918 11.7969 9.87918 12.2031 9.60727 12.4029Z' fill='%23D8DB4A' stroke='%23B5BF42'/><path d='M15.6073 12.4029L10.0461 16.4893C9.71586 16.732 9.25 16.4962 9.25 16.0864L9.25 7.91358C9.25 7.50381 9.71586 7.26802 10.0461 7.51066L15.6073 11.5971C15.8792 11.7969 15.8792 12.2031 15.6073 12.4029Z' fill='%23D8DB4A' stroke='%23B5BF42'/></g><defs><clipPath id='clip0_0_3'><rect width='16.63' height='17.5' fill='white'/></clipPath></defs></svg>";
  let flag =
    "data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNi42MyAxNy41Ij48ZGVmcz48c3R5bGU+LmNscy0xLC5jbHMtMntmaWxsOiM0Y2JmNTY7c3Ryb2tlOiM0NTk5M2Q7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO30uY2xzLTJ7c3Ryb2tlLXdpZHRoOjEuNXB4O308L3N0eWxlPjwvZGVmcz48dGl0bGU+aWNvbi0tZ3JlZW4tZmxhZzwvdGl0bGU+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNLjc1LDJBNi40NCw2LjQ0LDAsMCwxLDguNDQsMmgwYTYuNDQsNi40NCwwLDAsMCw3LjY5LDBWMTIuNGE2LjQ0LDYuNDQsMCwwLDEtNy42OSwwaDBhNi40NCw2LjQ0LDAsMCwwLTcuNjksMCIvPjxsaW5lIGNsYXNzPSJjbHMtMiIgeDE9IjAuNzUiIHkxPSIxNi43NSIgeDI9IjAuNzUiIHkyPSIwLjc1Ii8+PC9zdmc+";

  while (true) {
    let button = await addon.tab.waitForElement("[class^='green-flag_green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });

    const updateFlag = () => {
      button.src = mode ? fastFlag : flag;
    };

    const changeMode = (_mode = !mode) => {
      mode = _mode;
      if (mode) {
        setFPS(addon.settings.get("framerate"));

        // monitor updates are throttled by default
        // https://github.com/LLK/scratch-gui/blob/ba76db7/src/reducers/monitors.js
        if (!monitorUpdateFixed) {
          const originalListener = vm.listeners("MONITORS_UPDATE").find((f) => f.name === "onMonitorsUpdate");
          if (originalListener) vm.removeListener("MONITORS_UPDATE", originalListener);
          vm.on("MONITORS_UPDATE", (monitors) =>
            addon.tab.redux.dispatch({
              type: "scratch-gui/monitors/UPDATE_MONITORS",
              monitors,
            })
          );
          monitorUpdateFixed = true;
        }
      } else setFPS(30);
      updateFlag();
    };
    const flagListener = (e) => {
      if (addon.self.disabled) return;
      const isAltClick = e.type === "click" && e.altKey;
      const isChromebookAltClick = navigator.userAgent.includes("CrOS") && e.type === "contextmenu";
      if (isAltClick || isChromebookAltClick) {
        e.cancelBubble = true;
        e.preventDefault();
        changeMode();
      }
    };
    button.addEventListener("click", flagListener);
    button.addEventListener("contextmenu", flagListener);

    const setFPS = (fps) => {
      global_fps = addon.self.disabled ? 30 : fps;

      clearInterval(vm.runtime._steppingInterval);
      vm.runtime._steppingInterval = null;
      vm.runtime.start();
    };
    addon.settings.addEventListener("change", () => {
      if (vm.runtime._steppingInterval) {
        setFPS(addon.settings.get("framerate"));
      }
    });
    addon.self.addEventListener("disabled", () => changeMode(false));
    vm.runtime.start = function () {
      if (this._steppingInterval) return;
      let interval = 1000 / global_fps;
      this.currentStepTime = interval;
      this._steppingInterval = setInterval(() => {
        this._step();
      }, interval);
      this.emit("RUNTIME_STARTED");
    };
    updateFlag();
  }
}
