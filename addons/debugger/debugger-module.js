/** Class to log to the Debugger addon.*/
export default class DebuggerConsole {
  static log(msg, _thread) {
    const logEvent = new CustomEvent("logMessage", {
      detail: {
        msg: msg,
        thread: _thread ?? null,
        type: "internal",
      },
    });

    document.dispatchEvent(logEvent);
  }
  static warn(msg, _thread) {
    const logEvent = new CustomEvent("logMessage", {
      detail: {
        msg: msg,
        thread: _thread ?? null,
        type: "internal-warn",
      },
    });

    document.dispatchEvent(logEvent);
  }
  static error(msg, _thread) {
    const logEvent = new CustomEvent("logMessage", {
      detail: {
        msg: msg,
        thread: _thread ?? null,
        type: "internal-error",
      },
    });

    document.dispatchEvent(logEvent);
  }
  static addLog(msg, thread, type) {
    const logEvent = new CustomEvent("logMessage", {
      detail: {
        msg: msg,
        thread: thread,
        type: type !== "log" ? `internal-${type}` : "internal",
      },
    });

    document.dispatchEvent(logEvent);
  }
}
