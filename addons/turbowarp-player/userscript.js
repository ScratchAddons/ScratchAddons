export default async function ({ addon, console, msg }) {
  const action = addon.settings.get("action");
  let playerToggled = false;
  let scratchStage;
  let twIframeContainer = document.createElement("div");
  twIframeContainer.className = "sa-tw-iframe-container";
  let twIframe = document.createElement("iframe");
  twIframe.setAttribute("allowtransparency", "true");
  twIframe.setAttribute("allowfullscreen", "true");
  twIframe.setAttribute(
    "allow",
    "autoplay *; camera https://turbowarp.org; document-domain 'none'; fullscreen *; gamepad https://turbowarp.org; microphone https://turbowarp.org;"
  );
  twIframe.className = "sa-tw-iframe";
  twIframeContainer.appendChild(twIframe);

  const button = document.createElement("button");
  button.className = "button sa-tw-button";
  button.title = "TurboWarp";

  function removeIframe() {
    twIframeContainer.remove();
    scratchStage.style.display = "";
    button.classList.remove("scratch");
    playerToggled = false;
    button.title = "TurboWarp";
  }

  button.onclick = async (e) => {
    const projectId = window.location.pathname.split("/")[2];
    let search = "";
    if (addon.tab.redux.state?.preview?.projectInfo?.public === false) {
      let projectToken = (
        await (
          await fetch(
            `https://api.scratch.mit.edu/projects/${projectId}?current_time_to_get_updated_project_token=${Date.now()}`,
            {
              headers: {
                "x-token": await addon.auth.fetchXToken(),
              },
            }
          )
        ).json()
      ).project_token;
      search = `#?token=${projectToken}`;
    }
    if (action === "link" || e.ctrlKey || e.metaKey) {
      window.open(
        `https://turbowarp.org/${window.location.pathname.split("/")[2]}${search}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else {
      playerToggled = !playerToggled;
      if (playerToggled) {
        const username = await addon.auth.fetchUsername();
        const usp = new URLSearchParams();
        usp.set("settings-button", "1");
        if (username) usp.set("username", username);
        if (addon.settings.get("addons")) {
          const enabledAddons = await addon.self.getEnabledAddons("editor");
          usp.set("addons", enabledAddons.join(","));
        }
        // Apply the same fullscreen background color, consistently with the vanilla Scratch fullscreen behavior.
        // It's not expected here to support dynamicDisable/dynamicEnable of editor-dark-mode to work exactly
        // like it does with vanilla.
        const fullscreenBackground =
          document.documentElement.style.getPropertyValue("--editorDarkMode-fullscreen") || "white";
        usp.set("fullscreen-background", fullscreenBackground);
        const iframeUrl = `https://turbowarp.org/${projectId}/embed?${usp}${search}`;
        twIframe.src = "";
        scratchStage.parentElement.prepend(twIframeContainer);
        // Use location.replace to avoid creating a history entry
        twIframe.contentWindow.location.replace(iframeUrl);

        scratchStage.style.display = "none";
        button.classList.add("scratch");
        button.title = "Scratch";
        addon.tab.traps.vm.stopAll();
      } else removeIframe();
    }
  };

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
