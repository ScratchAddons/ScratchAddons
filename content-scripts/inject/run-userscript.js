import Addon from "../../addon-api/content-script/Addon.js";

export default async function runAddonUserscripts({ addonId, scripts }) {
  const addonObj = new Addon({ id: addonId });
  const globalObj = Object.create(null);
  for (const scriptPath of scripts) {
    const scriptUrl = `${document
      .getElementById("scratch-addons")
      .getAttribute("data-path")}addons/${addonId}/${scriptPath}`;
    console.log(
      `%cDebug addons/${addonId}/${scriptPath}: ${scriptUrl}`,
      "color:red; font-weight: bold; font-size: 1.2em;"
    );
    const x = await import(scriptUrl);
    const log = console.log.bind(console, `%c[${addonId}]`, "color:darkorange; font-weight: bold;");
    const warn = console.warn.bind(console, `%c[${addonId}]`, "color:darkorange font-weight: bold;");
    x.default({
      addon: addonObj,
      global: globalObj,
      console: { ...console, log, warn },
    });
  }
}
