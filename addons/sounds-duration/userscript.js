export default async function ({ addon, msg, global, console }) {
  while (true) {
    let container = await addon.tab.waitForElement("[class^=sound-editor_editor-container]", { markAsSeen: true });
    let el = container.querySelector("[class^=sound-editor_row]").appendChild(document.createElement("div"));
    let state = container[addon.tab.traps.getInternalKey(container)].return.return.return.stateNode;

    el.textContent =
      (0).toFixed(2) +
      "/" +
      (state.audioBufferPlayer.buffer.length / state.audioBufferPlayer.buffer.sampleRate).toFixed(2);

    let _handleUpdatePlayhead = state.handleUpdatePlayhead;
    state.handleUpdatePlayhead = function (playhead) {
      _handleUpdatePlayhead.call(this, playhead);
      const timeSinceStart = (Date.now() - this.startTime) / 1000;
      const trimStartTime = this.buffer.duration * this.trimStart;
      const trimmedDuration = this.buffer.duration * this.trimEnd - trimStartTime;
      el.textContent = timeSinceStart.toFixed(2) + "/" + trimmedDuration.toFixed(2);
    };

    let _componentWillReceiveProps = state.componentWillReceiveProps;
    state.componentWillReceiveProps = function (newProps) {
      _componentWillReceiveProps.call(this, newProps);
      el.textContent =
        (0).toFixed(2) +
        "/" +
        (this.audioBufferPlayer.buffer.length / this.audioBufferPlayer.buffer.sampleRate).toFixed(2);
    };

    let _handleUpdateTrim = state.handleUpdateTrim;
    state.handleUpdateTrim = function (trimStart, trimEnd) {
      _handleUpdateTrim.call(this, trimStart, trimEnd);
      const trimStartTime = state.audioBufferPlayer.buffer.duration * trimStart;
      const trimmedDuration = state.audioBufferPlayer.buffer.duration * trimEnd - trimStartTime;
      el.textContent = (0).toFixed(2) + "/" + trimmedDuration.toFixed(2);
    };
  }
}
