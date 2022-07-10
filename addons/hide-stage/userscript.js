export default async function ({ addon, console, msg }) {
  let stageHidden = false;
  while (true) {
    const stageControls = await addon.tab.waitForElement("[class*='stage-header_stage-size-toggle-group_']", {
      markAsSeen: true,
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    const bodyWrapper = document.querySelector("[class*='gui_body-wrapper_']");
    const smallStageButton = stageControls.firstChild;
    smallStageButton.classList.add("sa-stage-button-middle");
    const largeStageButton = stageControls.lastChild;
    const hideStageButton = Object.assign(document.createElement("div"), {
      role: "button",
      className: addon.tab.scratchClass(
        "button_outlined-button",
        "stage-header_stage-button",
        "stage-header_stage-button-first",
        { others: "sa-hide-stage-button" }
      ),
    });
    stageControls.insertBefore(hideStageButton, smallStageButton);
    hideStageButton.appendChild(
      Object.assign(document.createElement("img"), {
        className: addon.tab.scratchClass("stage-header_stage-button-icon"),
        src: addon.self.dir + "/icon.svg",
        alt: msg("hide-stage"),
        draggable: false,
      })
    );
    function hideStage() {
      stageHidden = true;
      bodyWrapper.classList.add("sa-stage-hidden");
      hideStageButton.classList.remove(addon.tab.scratchClass("stage-header_stage-button-toggled-off"));
      smallStageButton.firstChild.classList.add(addon.tab.scratchClass("stage-header_stage-button-toggled-off"));
      largeStageButton.firstChild.classList.add(addon.tab.scratchClass("stage-header_stage-button-toggled-off"));
      window.dispatchEvent(new Event("resize")); // resizes the code area and paint editor canvas
    }
    function unhideStage(e) {
      stageHidden = false;
      bodyWrapper.classList.remove("sa-stage-hidden");
      hideStageButton.classList.add(addon.tab.scratchClass("stage-header_stage-button-toggled-off"));
      if (e) {
        const target = e.target.closest("[class*='stage-header_stage-button_']");
        target.classList.remove(addon.tab.scratchClass("stage-header_stage-button-toggled-off"));
      }
      window.dispatchEvent(new Event("resize")); // resizes the code area and paint editor canvas
    }
    if (stageHidden) hideStage();
    else unhideStage();
    hideStageButton.addEventListener("click", hideStage);
    smallStageButton.addEventListener("click", unhideStage);
    largeStageButton.addEventListener("click", unhideStage);
  }
}
