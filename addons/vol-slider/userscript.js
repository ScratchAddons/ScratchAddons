export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;
  const defVol = addon.settings.get("defVol") / 100;
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

  function setVol(v) {
    vm.runtime.audioEngine.inputNode.gain.value = v;
    slider.value = v;
    if (v == 0) {
      icon.src = muteIcon;
    } else if (v < 0.5) {
      icon.src = quietIcon;
    } else {
      icon.src = loudIcon;
    }
  }

  addon.self.addEventListener("disabled", () => {
    vm.runtime.audioEngine.inputNode.gain.value = 1;
  });

  addon.self.addEventListener("reenabled", () => {
    setVol(defVol);
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
    setVol(defVol);
    slider.addEventListener("input", function (e) {
      setVol(this.value);
    });
  }
}
