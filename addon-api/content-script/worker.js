/**
 * @param {import("./Tab").default} tab
 * @param {string} script
 * @param {string} url
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
  (async ${script})({
    addon: {
      self: {
        id: ${tab._addonId},
        url: ${url},
        browser: ${typeof InstallTrigger !== "undefined" ? "firefox" : "chrome"},
      },
      tab: {
        clientVersion: ${tab.clientVersion},
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
