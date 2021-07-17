export default async function ({ addon, console }) {
  let playerToggled = false;
  let scratchStage;
  let twIframe = document.createElement("iframe");
  twIframe.scrolling = "no";
  twIframe.setAttribute("allowtransparency", "true");
  twIframe.setAttribute("allowfullscreen", "true");
  twIframe.className = "sa-tw-iframe";

  const button = document.createElement("button");
  button.className = "button see-inside-button sa-tw-button";
  button.title = "TurboWarp";

  function removeIframe() {
    twIframe.remove();
    scratchStage.style.display = "";
    button.classList.remove("scratch");
  }

  button.onclick = function buttonClick() {
    if (addon.settings.get("action") == "player") {
      playerToggled = !playerToggled;
      if (playerToggled) {
        let username = addon.auth.username ? "?username=" + addon.auth.username : "";
        twIframe.src = "//turbowarp.org/" + window.location.pathname.split("/")[2] + "/embed" + username;
        scratchStage.parentElement.append(twIframe);

        scratchStage.style.display = "none";
        button.classList.add("scratch");
        addon.tab.traps.vm.stopAll();
      } else removeIframe();
    } else {
      window.open("//turbowarp.org/" + window.location.pathname.split("/")[2], "_blank");
    }
  };

  while (true) {
    await addon.tab.waitForElement(".preview .project-buttons", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });
    addon.tab.appendToSharedSpace({ space: "beforeRemixButton", element: button, order: 1 });

    scratchStage = document.querySelector("[class^='stage-wrapper_stage-wrapper']");

    playerToggled = false;
    removeIframe();

    if (
      addon.settings.get("auto") &&
      addon.settings.get("action") === "player" &&
      [...document.querySelectorAll(".project-description")]
        .map((e) => e.innerText)
        .join(".")
        .match(/turbo ?warp/gi)
    )
      buttonClick();
  }
}
