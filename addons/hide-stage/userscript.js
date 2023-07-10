export default async function ({ addon, console, msg }) {
  let stageHidden = false;
  let bodyWrapper;
  let smallStageButton;
  let largeStageButton;
  let hideStageButton;

  function hideStage() {
    stageHidden = true;
    if (!bodyWrapper) return;
    document.body.classList.add("sa-stage-hidden-outer");
    // Inner class is applied to body wrapper so that it won't affect the project page.
    bodyWrapper.classList.add("sa-stage-hidden");
    // Temporary code to support both current and future Scratch version
    if (addon.tab.scratchClass("stage-header_stage-button-toggled-off"))
      hideStageButton.classList.remove(addon.tab.scratchClass("stage-header_stage-button-toggled-off"));
    hideStageButton.setAttribute("aria-pressed", true);
    smallStageButton.setAttribute("aria-pressed", false);
    largeStageButton.setAttribute("aria-pressed", false);
    window.dispatchEvent(new Event("resize")); // resizes the code area and paint editor canvas
  }

  function unhideStage(e) {
    stageHidden = false;
    if (!bodyWrapper) return;
    document.body.classList.remove("sa-stage-hidden-outer");
    bodyWrapper.classList.remove("sa-stage-hidden");
    // Temporary code to support both current and future Scratch version
    if (addon.tab.scratchClass("stage-header_stage-button-toggled-off"))
      hideStageButton.classList.add(addon.tab.scratchClass("stage-header_stage-button-toggled-off"));
    hideStageButton.setAttribute("aria-pressed", false);
    if (e) {
      const clickedButton = e.target.closest("button");
      if (clickedButton) clickedButton.setAttribute("aria-pressed", true);
    } else if (addon.tab.redux.state) {
      if (addon.tab.redux.state.scratchGui.stageSize.stageSize === "small")
        smallStageButton.setAttribute("aria-pressed", true);
      else largeStageButton.setAttribute("aria-pressed", true);
    }
    window.dispatchEvent(new Event("resize")); // resizes the code area and paint editor canvas
  }

  addon.self.addEventListener("disabled", () => unhideStage());

  while (true) {
    let stageControls = await addon.tab.waitForElement("[class*='stage-header_stage-size-toggle-group_']", {
      markAsSeen: true,
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    // Temporary code to support both current and future Scratch version
    stageControls = stageControls.querySelector("[class*='toggle-buttons_row_']") || stageControls;
    bodyWrapper = document.querySelector("[class*='gui_body-wrapper_']");
    smallStageButton = stageControls.firstChild;
    smallStageButton.classList.add("sa-stage-button-middle");
    largeStageButton = stageControls.lastChild;
    hideStageButton = Object.assign(document.createElement("button"), {
      type: "button",
      // Temporary code to support both current and future Scratch version
      className: addon.tab.scratchClass("stage-header_stage-button-first")
        ? addon.tab.scratchClass(
            "button_outlined-button",
            "stage-header_stage-button",
            "stage-header_stage-button-first",
            { others: "sa-hide-stage-button" },
          )
        : addon.tab.scratchClass("toggle-buttons_button", { others: "sa-hide-stage-button" }),
      title: msg("hide-stage"),
    });
    hideStageButton.setAttribute("aria-label", msg("hide-stage"));
    hideStageButton.setAttribute("aria-pressed", false);
    addon.tab.displayNoneWhileDisabled(hideStageButton);
    stageControls.insertBefore(hideStageButton, smallStageButton);
    const icon = Object.assign(document.createElement("img"), {
      className: addon.tab.scratchClass("stage-header_stage-button-icon"),
      src: addon.self.dir + "/icon.svg",
      draggable: false,
    });
    icon.setAttribute("aria-hidden", true);
    hideStageButton.appendChild(icon);
    if (stageHidden) hideStage();
    else unhideStage();
    hideStageButton.addEventListener("click", hideStage);
    smallStageButton.addEventListener("click", unhideStage);
    largeStageButton.addEventListener("click", unhideStage);
  }
}
