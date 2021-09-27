/**
 * @private
 */
export default (tab, script, url) => {
  script = script.replace(/^export default (?:async )?/, "");
  script = script.replace(
    /\) +(?:=>)? +\{/,
    (match) => `${match}
  postMessage("STARTED");
  `
  );
  return `
  (async () => {
    const console = (await import("../../libraries/common/console.js"))("worker");
    const localConsole = {
      log: console.logForAddon(${JSON.stringify(tab._addonId)}),
      warn: console.warnForAddon(${JSON.stringify(tab._addonId)}),
      error: console.errorForAddon(${JSON.stringify(tab._addonId)}),
    };
    (async () => { })({
      addon: {
        self: {
          id: ${JSON.stringify(tab._addonId)},
          url: ${JSON.stringify(url)},
          browser: ${JSON.stringify(typeof InstallTrigger !== "undefined" ? "firefox" : "chrome")},
        },
        tab: {
          clientVersion: ${JSON.stringify(tab.clientVersion)},
        },
        console: {...console, ...localConsole},
      }
    })();
  });
  `;
};
