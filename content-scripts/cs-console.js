(function () {
  const _realConsole = window.console;
  const consoleOutput = (logAuthor = "[cs]") => {
    const style = {
      // Remember to change these as well on module.js
      leftPrefix: "background:  #ff7b26; color: white; border-radius: 0.5rem 0 0 0.5rem; padding: 0 0.5rem",
      rightPrefix:
        "background: #222; color: white; border-radius: 0 0.5rem 0.5rem 0; padding: 0 0.5rem; font-weight: bold",
      text: "",
    };
    return [`%cSA%c${logAuthor}%c`, style.leftPrefix, style.rightPrefix, style.text];
  };
  window.console = {
    ..._realConsole,
    log: _realConsole.log.bind(_realConsole, ...consoleOutput()),
    warn: _realConsole.warn.bind(_realConsole, ...consoleOutput()),
    error: _realConsole.error.bind(_realConsole, ...consoleOutput()),
  };
})();
