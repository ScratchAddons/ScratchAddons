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

    let reactInternalInstance = container[addon.tab.traps.getInternalKey(container)];
    while (!reactInternalInstance.stateNode?.audioBufferPlayer) {
      reactInternalInstance = reactInternalInstance.return;
    }
    const soundEditor = reactInternalInstance.stateNode;

    function setText(running, selected) {
      const norm = (num) => {
        return Math.floor(num / 60) + ":" + ((Math.round(num * 100) / 100) % 60).toFixed(2).padStart(5, "0");
      };

      el.textContent = norm(running) + " / " + norm(selected);
    }

    setText(0, soundEditor.audioBufferPlayer.buffer.length / soundEditor.audioBufferPlayer.buffer.sampleRate);

    // https://github.com/scratchfoundation/scratch-gui/blob/develop/src/containers/sound-editor.jsx

    // When the sound is played aka the playhead was updated
    const _handleUpdatePlayhead = soundEditor.handleUpdatePlayhead;
    soundEditor.handleUpdatePlayhead = function (playhead) {
      _handleUpdatePlayhead.call(this, playhead);
      const timeSinceStart = (Date.now() - this.startTime) / 1000;
      const trimStartTime = soundEditor.audioBufferPlayer.buffer.duration * soundEditor.audioBufferPlayer.trimStart;
      const trimmedDuration =
        soundEditor.audioBufferPlayer.buffer.duration * soundEditor.audioBufferPlayer.trimEnd - trimStartTime;
      setText(timeSinceStart, trimmedDuration);
    };

    // When the sound is stopped or ends aka the playhead was stopped
    const _handleStoppedPlaying = soundEditor.handleStoppedPlaying;
    soundEditor.handleStoppedPlaying = function () {
      _handleStoppedPlaying.call(this);
      const trimStartTime = soundEditor.audioBufferPlayer.buffer.duration * soundEditor.audioBufferPlayer.trimStart;
      const trimmedDuration =
        soundEditor.audioBufferPlayer.buffer.duration * soundEditor.audioBufferPlayer.trimEnd - trimStartTime;
      if (trimmedDuration === 0) {
        setText(0, soundEditor.audioBufferPlayer.buffer.duration);
      } else {
        setText(0, trimmedDuration);
      }
    };

    // When the user changes to a different sound
    const _componentWillReceiveProps = soundEditor.componentWillReceiveProps;
    soundEditor.componentWillReceiveProps = function (newProps) {
      _componentWillReceiveProps.call(this, newProps);
      setText(0, soundEditor.audioBufferPlayer.buffer.length / soundEditor.audioBufferPlayer.buffer.sampleRate);
    };

    // When the user finishes selecting a part of the sound
    const _handleUpdateTrim = soundEditor.handleUpdateTrim;
    soundEditor.handleUpdateTrim = function (trimStart, trimEnd) {
      _handleUpdateTrim.call(this, trimStart, trimEnd);
      const trimStartTime = soundEditor.audioBufferPlayer.buffer.duration * trimStart;
      const trimmedDuration = soundEditor.audioBufferPlayer.buffer.duration * trimEnd - trimStartTime;
      if (trimmedDuration === 0) {
        setText(0, soundEditor.audioBufferPlayer.buffer.duration);
      } else {
        setText(0, trimmedDuration);
      }
    };
  }
}
