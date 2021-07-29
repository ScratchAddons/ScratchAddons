export default async function ({ addon, console, msg }) {
  const action = addon.settings.get("action");
  let playerToggled = false;
  let scratchStage;
  let twIframe = document.createElement("iframe");
  twIframe.setAttribute("allowtransparency", "true");
  twIframe.setAttribute("allowfullscreen", "true");
  twIframe.className = "sa-tw-iframe";

  const button = document.createElement("button");
  button.className = "button sa-tw-button";
  button.title = "TurboWarp";

  function removeIframe() {
    twIframe.remove();
    scratchStage.style.display = "";
    button.classList.remove("scratch");
    playerToggled = false;
  }

  button.onclick = async () => {
    if (action === "player") {
      playerToggled = !playerToggled;
      if (playerToggled) {
        const username = await addon.auth.fetchUsername();
        const usernameUrlParam = username ? `?username=${username}` : "";
        const projectId = window.location.pathname.split("/")[2];
        const iframeUrl = `https://turbowarp.org/${projectId}/embed${usernameUrlParam}`;
        twIframe.src = "";
        scratchStage.parentElement.prepend(twIframe);
        // Use location.replace to avoid creating a history entry
        twIframe.contentWindow.location.replace(iframeUrl);

        scratchStage.style.display = "none";
        button.classList.add("scratch");
        addon.tab.traps.vm.stopAll();
      } else removeIframe();
    } else {
      window.open("https://turbowarp.org/" + window.location.pathname.split("/")[2], "_blank");
    }
  };

  addon.tab.addEventListener("urlChange", removeIframe);

  let showAlert = true;
  while (true) {
    const seeInside = await addon.tab.waitForElement(".see-inside-button", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });

    seeInside.addEventListener("click", function seeInsideClick(event) {
      if (!playerToggled || !showAlert) return;

      if (confirm(msg("confirmation"))) {
        showAlert = false;
      } else {
        event.stopPropagation();
      }
    });

    addon.tab.appendToSharedSpace({ space: "beforeRemixButton", element: button, order: 1 });

    scratchStage = document.querySelector(".guiPlayer");
  }
}
