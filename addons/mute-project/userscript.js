export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;
  let vol = 1;
  let icon = document.createElement("img");
  let mute = "/static/assets/e21225ab4b675bc61eed30cfb510c288.svg";
  let quiet = "/static/assets/3547fa1f2678a483a19f46852f36b426.svg";
  let loud = "/static/assets/b2c44c738c9cbc1a99cd6edfd0c2b85b.svg";
  icon.src = loud;
  icon.loading = "lazy";
  let slider = document.createElement("input");
  slider.type = "range";
  slider.min = 0;
  slider.max = 1;
  slider.step = 0.01;
  slider.style.width = "100px";
  const toggleMute = (e) => {
    if (!addon.self.disabled && (e.ctrlKey || e.metaKey)) {
      e.cancelBubble = true;
      e.preventDefault();
      setVol(vol == 0 ? 1 : 0);
    }
  };

  function setVol(v) {
    vol = v;
    vm.runtime.audioEngine.inputNode.gain.value = vol;
    slider.value = vol;
    if (vol == 0) {
      icon.src = mute;
      icon.style.display = "block";
      return;
    }
    if (vol < 0.5) {
      icon.src = quiet;
    } else {
      icon.src = loud;
    }
    icon.style.display = addon.settings.get("show-slider") ? "block" : "none";
  }

  addon.self.addEventListener("disabled", () => {
    vm.runtime.audioEngine.inputNode.gain.value = 1;
    icon.style.display = "none";
    slider.style.display = "none";
  });

  addon.self.addEventListener("reenabled", () => {
    if (addon.settings.get("show-slider")) {
      slider.style.display = "block";
    }
    setVol(1);
  });

  while (true) {
    let button = await addon.tab.waitForElement("[class^='green-flag_green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: icon, order: 0 });
    button.addEventListener("click", toggleMute);
    button.addEventListener("contextmenu", toggleMute);
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: slider, order: 0 });
    setVol(1);
    slider.addEventListener("change", function (e) {
      setVol(this.value);
    });
    addon.settings.addEventListener("change", function () {
      if (addon.settings.get("show-slider")) {
        slider.style.display = "block";
      } else {
        slider.style.display = "none";
        vol = 1;
      }
      setVol(vol);
    });
  }
}
