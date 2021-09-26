import manifests from "./load-addon-manifests.js";

(async () => {
  scratchAddons.manifests = await manifests(true);
  scratchAddons.localState.ready.manifests = true;
  scratchAddons.localEvents.dispatchEvent(new CustomEvent("manifestsReady"));
})();
