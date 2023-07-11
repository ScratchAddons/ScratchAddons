function updateClass() {
  const state = __scratchAddonsRedux.state;
  if (!state) return;
  const isSmallStage = state.scratchGui.stageSize.stageSize === "small";
  const isFullScreen = state.scratchGui.mode.isFullScreen;
  const isPlayerOnly = state.scratchGui.mode.isPlayerOnly;
  document.body.classList.toggle("sa-small-stage", isSmallStage && !isFullScreen && !isPlayerOnly);
}

function handleStateChange(e) {
  if (
    e.detail.action.type === "scratch-gui/StageSize/SET_STAGE_SIZE" ||
    e.detail.action.type === "scratch-gui/mode/SET_FULL_SCREEN" ||
    e.detail.action.type === "scratch-gui/mode/SET_PLAYER"
  ) {
    updateClass();
  }
}

export default function addSmallStageClass() {
  if (!__scratchAddonsRedux.target) return;
  updateClass();
  /* The listener isn't an anonymous function to make sure that only one listener is added
     if multiple addons on the same tab use this module. */
  __scratchAddonsRedux.target.addEventListener("statechanged", handleStateChange);
}
