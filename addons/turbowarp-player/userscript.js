export default async function ({ addon, console }) {
  let playerToggled = false;
  let scratchStage;
  let twIframe = document.createElement("iframe");
  twIframe.style.border = "none";
  twIframe.style.display = "none";
  twIframe.scrolling = "no";
  twIframe.allowtransparency = "true";
  twIframe.allowfullscreen = "true";
  // The stage is "bouncing" after switching
  twIframe.style.width = "499px";
  twIframe.style.height = "416px";

  const button = document.createElement("button");
  button.className = "button see-inside-button sa-tw-button";
  button.title = "TurboWarp";

  button.onclick = (event) => {
    if (addon.settings.get("action") == "player") {
      playerToggled = !playerToggled;
      if (playerToggled) {
        twIframe.style.display = "";
        scratchStage.style.display = "none";
        button.classList.add("scratch");
      } else {
        twIframe.style.display = "none";
        scratchStage.style.display = "";
        button.classList.remove("scratch");
      }
    } else {
      window.open("//turbowarp.org/" + window.location.pathname.split("/")[2], "_blank");
    }
  };

  while (true) {
    const row = await addon.tab.waitForElement(".preview .project-buttons", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });
    row.prepend(button);

    scratchStage = document.querySelector("[class^='stage-wrapper_stage-wrapper']");

    twIframe.src =
      "//turbowarp.org/" + window.location.pathname.split("/")[2] + "/embed?username=" + addon.auth.username;

    scratchStage.parentElement.append(twIframe);

    playerToggled = true;
    button.click();

    if (
      addon.settings.get("auto") &&
      addon.settings.get("action") == "player" &&
      [...document.querySelectorAll(".project-description")]
        .map((e) => e.innerText)
        .join(".")
        .match(/turbo ?warp/gi)
    )
      button.click();
  }
}
