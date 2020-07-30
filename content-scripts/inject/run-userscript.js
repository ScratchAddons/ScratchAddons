import Addon from "../../addon-api/content-script/Addon.js";
import evalScript from "./eval-userscript.js";

export default async function runAddonUserscripts({ addonId, scripts }) {
  const addonObj = new Addon({ id: addonId });
  const globalObj = Object.create(null);
  for (const scriptPath of scripts) {
    const pseudoUrl = `scratchaddons://userscripts/${addonId}@${scriptPath
      .split("/")
      .join("@")}`;
    console.log(
      `%cDebug addons/${addonId}/${scriptPath}: ${pseudoUrl}`,
      "color:red; font-weight: bold; font-size: 1.3em;"
    );
    let codeToEvaluate = "";
    codeToEvaluate += await (
      await fetch(
        `${document
          .getElementById("scratch-addons")
          .getAttribute("data-path")}addons/${addonId}/${scriptPath}`
      )
    ).text();
    codeToEvaluate += "\n//# sourceURL=" + pseudoUrl;
    evalScript(codeToEvaluate, addonObj, globalObj);
  }
}
