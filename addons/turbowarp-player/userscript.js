export default async function ({ addon, console, msg }) {
  const action = addon.settings.get("action");
  const autoreplace = addon.settings.get("auto");
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

  console.log(action);
  console.log(autoreplace);
  //Shows a more detailed message as a title, if "Always Choose" option is enabled
  if (action === "both") {
    //If it's automatically replaces, we have to replace the title automatically as well
    if (autoreplace) {
      button.title = msg("scrunch-new-win-info");
      button.classList.add("scratch");
    } else {
      button.title = msg("tw-new-win-info");
    }
  } else {
    
    if (action === "replace") {
      if (autoreplace) {
        button.title = "Scratch";
        button.classList.add("scratch");
        console.log("Added Scratch button")
      } else {
        button.title = "TurboWarp";
      };
    } else {
      console.log("Halihó!")
      button.title = "TurboWarp";
    }
  }

  let parameters = addon.settings.get("url-params");
  let urlParams = "";

  function removeIframe() {
    twIframeContainer.remove();
    scratchStage.style.display = "";
    button.classList.remove("scratch");
    playerToggled = false;
    //The same here
    if (action === "both") {
      button.title = msg("tw-new-win-info")
    } else {
      button.title = "TurboWarp";
    }
  }

  //Function to get the important values from a parameter settings item
  function getParameter(fromObject) {
    let string = JSON.stringify(fromObject);
    let newstring = "";
    let letterNum = 0;
    for (var i=0; (i < string.length && !(string[i-1] === ":")); i++) {
      letterNum +=1;
      console.log(letterNum);
      console.log(string.length);
      console.log(string[i]);
    }
    letterNum += 1;
    for (var i=0; (letterNum < string.length && !(string[letterNum] === "\"")); i++) {
      newstring += string[letterNum];
      letterNum +=1;
    }
    console.log(newstring);
    return newstring;
  }

  //This variable stores if ctrl is pressed
  let openedInNewTab = false;

  const buttonAction = async (e) => {
    let search = "";
    if (
      addon.tab.redux.state?.preview?.projectInfo?.public === false &&
      addon.tab.redux.state.preview.projectInfo.project_token
    ) {
      search = `#?token=${addon.tab.redux.state.preview.projectInfo.project_token}`;
    }
    //checks if the control key is pressed
    if ((e.ctrlKey || e.metaKey) && action === "both") {
      openedInNewTab = true;
    }

    //Loads in the special URL parameters
    if(parameters.length > 0) {
      urlParams = "";
      parameters.forEach((thisPar, l) => {
        urlParams += getParameter(thisPar);
        if (l + 1 !== parameters.length || playerToggled) {
          urlParams += "&";
        }
        return;
      })
    }

    if ((action === "player") || (action === "both" && !openedInNewTab)) {
      playerToggled = !playerToggled;
      console.log(playerToggled);
      
      if (playerToggled) {
        const username = await addon.auth.fetchUsername();
        const usp = new URLSearchParams();
        if (username && !(urlParams.includes("username="))) usp.set("username", username);
        const projectId = window.location.pathname.split("/")[2];
        if (addon.settings.get("addons")) {
          const enabledAddons = await addon.self.getEnabledAddons("editor");
          usp.set("addons", enabledAddons.join(","));
          
        }
        
        const iframeUrl = `https://turbowarp.org/${projectId}/embed?${urlParams}${usp}${search}`;
        console.log(iframeUrl);
        twIframe.src = "";
        scratchStage = await addon.tab.waitForElement(".guiPlayer");
        scratchStage.parentElement.prepend(twIframeContainer);
        // Use location.replace to avoid creating a history entry
        twIframe.contentWindow.location.replace(iframeUrl);

        scratchStage.style.display = "none";
        button.classList.add("scratch");
        if (action === "both") {
          button.title = msg("scrunch-new-win-info");
        } else {
          button.title = "Scratch";
        }
        
        addon.tab.traps.vm.stopAll();
      } else removeIframe();
    } else {
      window.open(
        `https://turbowarp.org/${window.location.pathname.split("/")[2]}${search}?${urlParams}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
    openedInNewTab = false;
  };

   

  //When its clicked it also executes it
  button.onclick = buttonAction;
  //If auto is enabled, instantly executes the replacing function
  if (addon.settings.get("auto") && (action === "player" || action === "both")) {
    buttonAction();
  }

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
