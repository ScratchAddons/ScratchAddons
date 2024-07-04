import globalStateProxy from "./imports/global-state.js";
import localStateProxy from "./imports/local-state.js";
import BackgroundLocalizationProvider from "./l10n.js";

globalThis.scratchAddons = {};

// Event target for local background page events
scratchAddons.localEvents = new EventTarget();

// Load manifests into memory
scratchAddons.manifests = [];
// addonId to set of addon IDs that has the addon inside userstyle's settings.if.addonEnabled
scratchAddons.dependents = {};

// Other files may add their own global methods here so that addon-api files can access them
scratchAddons.methods = {};

scratchAddons.l10n = new BackgroundLocalizationProvider();
// Can't load translations here.

scratchAddons.globalState = globalStateProxy;
console.log(
  "%cscratchAddons.globalState",
  "font-weight: bold;",
  "initialized:\n",
  JSON.parse(JSON.stringify(scratchAddons.globalState))
);

scratchAddons.localState = localStateProxy;
console.log(
  "%cscratchAddons.localState",
  "font-weight: bold;",
  "initialized:\n",
  JSON.parse(JSON.stringify(scratchAddons.localState))
);

/**
 * @type {object.<string, Port[]>}
 */
scratchAddons.popupPorts = {};
scratchAddons.sendToPopups = (value) =>
  Object.values(scratchAddons.popupPorts).forEach((ports) => ports.forEach((port) => port.postMessage(value)));
