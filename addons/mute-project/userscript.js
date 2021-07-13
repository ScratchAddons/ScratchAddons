export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;
  let muted = false;
  let icon = document.createElement("img");
  icon.src = "/static/assets/e21225ab4b675bc61eed30cfb510c288.svg";
  icon.loading = "lazy";
  icon.style.display = "none";
  const toggleMute = (e) => {
    if (e.ctrlKey) {
      e.cancelBubble = true;
      e.preventDefault();
      muted = !muted;
      if (muted) {
        vm.runtime.audioEngine.inputNode.gain.value = 0;
        icon.style.display = "block";
      } else {
        vm.runtime.audioEngine.inputNode.gain.value = 1;
        icon.style.display = "none";
      }
    }
  };
  while (true) {
    let button = await addon.tab.waitForElement("[class^='green-flag_green-flag']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
    });
    addon.tab.appendToSharedSpace({ space: "afterStopButton", element: icon, order: 0 });
    button.addEventListener("click", toggleMute);
    button.addEventListener("contextmenu", toggleMute);
  }
}
