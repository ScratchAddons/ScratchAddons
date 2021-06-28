export default async function ({ addon, console }) {
  let playerToggled = false;
  let wasEverToggled = false;
  let scratchStage;
  let twIframe = document.createElement("iframe");
  twIframe.scrolling = "no";
  twIframe.setAttribute("allowtransparency", "true");
  twIframe.setAttribute("allowfullscreen", "true");
  twIframe.className = "sa-tw-iframe";

  const button = document.createElement("button");
  button.className = "button see-inside-button sa-tw-button";
  button.title = "TurboWarp";

  function hideIframe() {
    twIframe.style.display = "none";
    scratchStage.style.display = "";
    button.classList.remove("scratch");
  }

  button.onclick = function buttonClick() {
    if (addon.settings.get("action") == "player") {
      playerToggled = !playerToggled;
      if (playerToggled) {
        twIframe.style.display = "";
        scratchStage.style.display = "none";
        button.classList.add("scratch");
        if (!wasEverToggled) {
          let username = addon.auth.username ? "?username=" + addon.auth.username : "";
          twIframe.src = "//turbowarp.org/" + window.location.pathname.split("/")[2] + "/embed" + username;
          scratchStage.parentElement.append(twIframe);
        }
        wasEverToggled = true;
      } else hideIframe();
    } else {
      window.open("//turbowarp.org/" + window.location.pathname.split("/")[2], "_blank");
    }
  };

  while (true) {
    const row = await addon.tab.waitForElement(".preview .project-buttons", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });
    row.prepend(button);

    scratchStage = document.querySelector("[class^='stage-wrapper_stage-wrapper']");

    wasEverToggled = false;
    playerToggled = false;
    hideIframe();

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
