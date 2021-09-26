const consoleOutput = (logAuthor) => {
  const style = {
    leftPrefix: "background:  #ff7b26; color: white; border-radius: 0.5rem 0 0 0.5rem; padding: 0 0.5rem",
    rightPrefix:
      "background: #222; color: white; border-radius: 0 0.5rem 0.5rem 0; padding: 0 0.5rem; font-weight: bold",
    text: "",
  };
  return [`%cSA%c[${logAuthor}]%c`, style.leftPrefix, style.rightPrefix, style.text];
};

export default (logAuthor)=>({
  ..._realConsole,
  log: _realConsole.log.bind(_realConsole, ...consoleOutput(logAuthor)),
  warn: _realConsole.warn.bind(_realConsole, ...consoleOutput(logAuthor)),
  error: _realConsole.error.bind(_realConsole, ...consoleOutput(logAuthor)),

  logForAddon: (addonId) => _realConsole.log.bind(_realConsole, ...consoleOutput(addonId)),
  warnForAddon: (addonId) => _realConsole.warn.bind(_realConsole, ...consoleOutput(addonId)),
  errorForAddon: (addonId) => _realConsole.error.bind(_realConsole, ...consoleOutput(addonId)),
});
