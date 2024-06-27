export default async function ({ addon, msg, console }) {
  while (true) {
    const container = await addon.tab.waitForElement("[class^=sound-editor_editor-container]", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 2 && !state.scratchGui.mode.isPlayerOnly,
    });
    const el = container.querySelector("[class^=sound-editor_row]").appendChild(
      Object.assign(document.createElement("div"), {
        className: "sa-sound-duration",
      })
    );
    addon.tab.displayNoneWhileDisabled(el);

    const state = container[addon.tab.traps.getInternalKey(container)].return.return.return.stateNode;

    function setText(running, selected) {
      const norm = (num) => {
        return Math.floor(num / 60) + ":" + ((Math.round(num * 100) / 100) % 60).toFixed(2).padStart(5, "0");
      };

      el.textContent = norm(running) + " / " + norm(selected);
    }

    setText(0, state.audioBufferPlayer.buffer.length / state.audioBufferPlayer.buffer.sampleRate);

    // https://github.com/scratchfoundation/scratch-gui/blob/develop/src/containers/sound-editor.jsx

    // When the sound is played aka the playhead was updated
    const _handleUpdatePlayhead = state.handleUpdatePlayhead;
    state.handleUpdatePlayhead = function (playhead) {
      _handleUpdatePlayhead.call(this, playhead);
      const timeSinceStart = (Date.now() - this.startTime) / 1000;
      const trimStartTime = state.audioBufferPlayer.buffer.duration * state.audioBufferPlayer.trimStart;
      const trimmedDuration = state.audioBufferPlayer.buffer.duration * state.audioBufferPlayer.trimEnd - trimStartTime;
      setText(timeSinceStart, trimmedDuration);
    };

    // When the sound is stopped or ends aka the playhead was stopped
    const _handleStoppedPlaying = state.handleStoppedPlaying;
    state.handleStoppedPlaying = function () {
      _handleStoppedPlaying.call(this);
      const trimStartTime = state.audioBufferPlayer.buffer.duration * state.audioBufferPlayer.trimStart;
      const trimmedDuration = state.audioBufferPlayer.buffer.duration * state.audioBufferPlayer.trimEnd - trimStartTime;
      if (trimmedDuration === 0) {
        setText(0, state.audioBufferPlayer.buffer.duration);
      } else {
        setText(0, trimmedDuration);
      }
    };

    // When the user changes to a different sound
    const _componentWillReceiveProps = state.componentWillReceiveProps;
    state.componentWillReceiveProps = function (newProps) {
      _componentWillReceiveProps.call(this, newProps);
      setText(0, state.audioBufferPlayer.buffer.length / state.audioBufferPlayer.buffer.sampleRate);
    };

    // When the user finishes selecting a part of the sound
    const _handleUpdateTrim = state.handleUpdateTrim;
    state.handleUpdateTrim = function (trimStart, trimEnd) {
      _handleUpdateTrim.call(this, trimStart, trimEnd);
      const trimStartTime = state.audioBufferPlayer.buffer.duration * trimStart;
      const trimmedDuration = state.audioBufferPlayer.buffer.duration * trimEnd - trimStartTime;
      if (trimmedDuration === 0) {
        setText(0, state.audioBufferPlayer.buffer.duration);
      } else {
        setText(0, trimmedDuration);
      }
    };
  }
}
