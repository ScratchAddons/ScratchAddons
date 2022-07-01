export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;
  const muteIcon = "/static/assets/e21225ab4b675bc61eed30cfb510c288.svg";
  const quietIcon = "/static/assets/3547fa1f2678a483a19f46852f36b426.svg";
  const loudIcon = "/static/assets/b2c44c738c9cbc1a99cd6edfd0c2b85b.svg";
  let icon = document.createElement("img");
  icon.loading = "lazy";
  let slider = document.createElement("input");
  slider.type = "range";
  slider.min = 0;
  slider.max = 1;
  slider.step = 0.02;
  const toggleMute = (e) => {
    if (!addon.self.disabled && (e.ctrlKey || e.metaKey)) {
      e.cancelBubble = true;
      e.preventDefault();
      setVol(slider.value == 0 ? 1 : 0);
    }
  };

  function setVol(v) {
    vm.runtime.audioEngine.inputNode.gain.value = v;
    slider.value = v;
    if (v == 0) {
      icon.src = muteIcon;
      icon.style.display = "inline-block";
      return;
    }
    icon.src = v < 0.5 ? quietIcon : loudIcon;
    icon.style.display = addon.settings.get("show-slider") ? "inline-block" : "none";
  }

  addon.self.addEventListener("disabled", () => {
    vm.runtime.audioEngine.inputNode.gain.value = 1;
  });

  addon.self.addEventListener("reenabled", () => {
    setVol(1);
  });

  while (true) {
    let button = await addon.tab.waitForElement("[class^='green-flag_green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    const container = document.createElement("div");
    container.className = "sa-volume";
    addon.tab.displayNoneWhileDisabled(container, { display: "inline-block" });
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: container, order: 0 });
    container.appendChild(icon);
    container.appendChild(slider);
    button.addEventListener("click", toggleMute);
    button.addEventListener("contextmenu", toggleMute);
    setVol(0.5);
    slider.addEventListener("change", function (e) {
      setVol(this.value);
    });
    addon.settings.addEventListener("change", function () {
      if (addon.settings.get("show-slider")) {
        slider.style.display = "inline-block";
      } else {
        slider.style.display = "none";
      }
      setVol(1);
    });
  }
}
