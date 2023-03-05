export default async ({ addon }) => {
  let repeat = false;

  function addButton() {
    const inputGroup = document.querySelector(
      '[class*="sound-editor_row-reverse"] [class*="sound-editor_input-group"]'
    );
    const repeatButton = document.createElement("button");
    repeatButton.className = `${addon.tab.scratchClass(
      "sound-editor_round-button"
    )} sound-editor_repeat-button`;
    if (repeat) repeatButton.classList.add("enable");
    repeatButton.addEventListener("click", function () {
      repeat = !repeat;
      if (repeat) repeatButton.classList.add("enable");
      else repeatButton.classList.remove("enable");
    });
    const buttonIcon = document.createElement("img");
    buttonIcon.src = "/static/assets/2f9cda00a530ac237fc24063067377c3.svg";
    buttonIcon.setAttribute("draggable", false);
    repeatButton.appendChild(buttonIcon);
    inputGroup.appendChild(repeatButton);
  }

  addon.self.addEventListener("disabled", function () {
    const inputGroup = document.querySelector(
      '[class*="sound-editor_row-reverse"] [class*="sound-editor_input-group"]'
    );
    inputGroup.removeChild(
      inputGroup.querySelector(".sound-editor_repeat-button")
    );
    repeat = false;
  });

  addon.self.addEventListener("reenabled", function () {
    addButton();
  });

  while (true) {
    const container = await addon.tab.waitForElement(
      "[class^=sound-editor_editor-container]",
      {
        markAsSeen: true,
        reduxCondition: (state) =>
          state.scratchGui.editorTab.activeTabIndex === 2 &&
          !state.scratchGui.mode.isPlayerOnly,
      }
    );
    const state =
      container[addon.tab.traps.getInternalKey(container)].return.return.return
        .stateNode;
    const _handleStoppedPlaying = state.handleStoppedPlaying;
    state.handleStoppedPlaying = function () {
      _handleStoppedPlaying.call(this);
      if (
        repeat &&
        Math.floor(
          ((Date.now() - state.audioBufferPlayer.startTime) / 1000).toFixed(2) *
            10
        ) ==
          Math.floor(
            (
              state.audioBufferPlayer.buffer.duration *
                state.audioBufferPlayer.trimEnd -
              state.audioBufferPlayer.buffer.duration *
                state.audioBufferPlayer.trimStart
            ).toFixed(2) * 10
          )
      )
        state.handlePlay();
    };
    addButton();
  }
};
