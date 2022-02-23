/** @private */
export default (tab, script, url) => {
  script = script.replace(/^export default (?:async )?/, "");
  script = script.replace(
    /\) +(?:=>)? +\{/,
    (match) => `${match}
  postMessage("STARTED");
  `
  );
  return `
  (async ${script})({
    addon: {
      self: {
        id: ${JSON.stringify(tab._addonId)},
        url: ${JSON.stringify(url)},
        browser: ${JSON.stringify(typeof InstallTrigger !== "undefined" ? "firefox" : "chrome")},
      },
      tab: {
        clientVersion: ${JSON.stringify(tab.clientVersion)},
      },
      console: {
        ...console,
        log: console.log.bind(
          console,
          \`%c[${tab._addonId} (worker)]\`,
          "color:darkorange; font-weight: bold;"
        ),
        warn: console.warn.bind(
          console,
          \`%c[${tab._addonId} (worker)]\`,
          "color:darkorange; font-weight: bold;"
        ),
      },
    }
  });
  `;
};
