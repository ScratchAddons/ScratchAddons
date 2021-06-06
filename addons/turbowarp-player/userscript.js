export default async function ({ addon, console }) {
  let playerToggled = false;
  let scratchStage;
  let twIframe = document.createElement("iframe");
  twIframe.style.border = "none";
  twIframe.style.display = "none";
  twIframe.scrolling = "no";
  twIframe.allowtransparency = "true";
  twIframe.allowfullscreen = "true";

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
    let row = await addon.tab.waitForElement(".project-buttons", { markAsSeen: true });
    scratchStage = document.querySelector("[class^='stage-wrapper_stage-wrapper']");

    twIframe.src = "//turbowarp.org/" + window.location.pathname.split("/")[2] + "/embed";
    // TODO: Height and width is weird.
    twIframe.style.width = scratchStage.clientWidth + "px";
    twIframe.style.height = scratchStage.clientHeight + "px";

    scratchStage.parentElement.append(twIframe);

    playerToggled = true;
    button.click();

    row.prepend(button);

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
