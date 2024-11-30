export default async function ({ addon, console }) {
  // https://github.com/scratchfoundation/scratch-vm/blob/6ea3f2198b29ec2b6e66b74e919cd8f14982acef/src/engine/runtime.js#L2573
  // The argument `monitor` is sometimes an immutable.Map and sometimes a
  // vanilla JavaScript map.
  // this._monitorState is an immutable.Map.
  // immutable.Map comes from https://www.npmjs.com/package/immutable.
  const _requestUpdateMonitor = addon.tab.traps.vm.runtime.requestUpdateMonitor;
  addon.tab.traps.vm.runtime.requestUpdateMonitor = function (monitor) {
    const id = monitor.get("id");
    const currentMonitor = this._monitorState.get(id);
    const monitorValue = monitor.get("value");
    const currentMonitorValue = currentMonitor?.get("value");
    if (
      !addon.self.disabled &&
      currentMonitor &&
      !currentMonitor.isSuperset(monitor) &&
      !(
        Array.isArray(monitorValue) &&
        Array.isArray(currentMonitorValue) &&
        monitorValue.length === currentMonitorValue.length &&
        monitorValue.every((mvi, i) => mvi === currentMonitorValue[i])
      )
    ) {
      addon.tab.redux.dispatch({
        type: "scratch-gui/project-changed/SET_PROJECT_CHANGED",
        changed: true,
      });
    }
    return _requestUpdateMonitor.call(this, monitor);
  };
}
