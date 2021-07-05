import BackgroundLocalizationProvider from "./l10n.js";

(async function () {
  /** @type {string[]} */
  const folderNames = await (await fetch("/addons/addons.json")).json();
  folderNames.forEach((addonId, i) => {
    if (folderNames.lastIndexOf(addonId) !== i)
      throw new ReferenceError("`" + addonId + "` is duplicated in ./addons/addons.json");
  });
  if (scratchAddons.l10n instanceof BackgroundLocalizationProvider) await scratchAddons.l10n.load(folderNames);
  const useDefault = scratchAddons.l10n.locale.startsWith("en");
  for (const folderName of folderNames) {
    if (folderName.startsWith("//")) continue;
    const manifest = await (await fetch(`/addons/${folderName}/addon.json`)).json();
    if (!useDefault) {
      manifest._english = {};
      if (manifest.name) {
        manifest._english.name = manifest.name;
        manifest.name = scratchAddons.l10n.get(`${folderName}/@name`, {}, manifest.name);
      }
      if (manifest.description) {
        manifest._english.description = manifest.description;
        manifest.description = scratchAddons.l10n.get(`${folderName}/description`, {}, manifest.description);
      }
      if (manifest.info) {
        for (const info of manifest.info || []) {
          info.text = scratchAddons.l10n.get(`${folderName}/@info-${info.id}`, {}, info.text);
        }
      }
      if (manifest.popup) {
        manifest.popup.name = scratchAddons.l10n.get(`${folderName}/@popup-name`, {}, manifest.popup.name);
      }
    }
    for (const propName of ["userscripts", "userstyles"]) {
      const injectables = manifest[propName] || [];
      for (const injectable of injectables) {
        const { matches } = injectable;
        if (typeof matches === "string" && matches.startsWith("^")) {
          injectable._scratchDomainImplied = !matches.startsWith("^https:");
          injectable.matches = new RegExp(matches, "u");
        } else if (Array.isArray(matches)) {
          for (let i = matches.length; i--; ) {
            const match = matches[i];
            if (typeof match === "string" && match.startsWith("^")) {
              const regexp = new RegExp(match, "u");
              regexp._scratchDomainImplied = !match.startsWith("^https:");
              matches[i] = regexp;
            }
          }
        }
      }
    }

    for (const preset of manifest.presets || []) {
      if (preset.name && !useDefault) {
        preset.name = scratchAddons.l10n.get(`${folderName}/@preset-name-${preset.id}`, {}, preset.name);
      }
      if (preset.description && !useDefault) {
        preset.description = scratchAddons.l10n.get(
          `${folderName}/@preset-description-${preset.id}`,
          {},
          preset.description
        );
      }
    }
    for (const option of manifest.settings || []) {
      if (!useDefault) {
        option.name = scratchAddons.l10n.get(
          `${folderName}/@settings-name-${option.id}`,
          {
            commentIcon: "@comment.svg",
            forumIcon: "@forum.svg",
            heartIcon: "@heart.svg",
            starIcon: "@star.svg",
            followIcon: "@follow.svg",
            studioAddIcon: "@studio-add.svg",
            studioIcon: "@studio.svg",
            remixIcon: "@remix.svg",
            adminusersIcon: "@adminusers.svg",
          },
          option.name
        );
      }
      switch (option.type) {
        case "string":
          if (!useDefault) {
            option.default = scratchAddons.l10n.get(
              `${folderName}/@settings-default-${option.id}`,
              {},
              `${option.default}`
            );
          }
          break;
        case "select":
          option.potentialValues = option.potentialValues?.map((value) => {
            if (typeof value === "string") {
              return { name: value, id: value };
            }
            if (!useDefault) {
              value.name = scratchAddons.l10n.get(
                `${folderName}/@settings-select-${option.id}-${value.id}`,
                {},
                value.name
              );
            }
            return value;
          });
          break;
      }
    }
    scratchAddons.manifests?.push({ addonId: folderName, manifest });
  }
  if (!scratchAddons.localState) throw new TypeError("localState is not set");
  scratchAddons.localState.ready.manifests = true;
  scratchAddons.localEvents?.dispatchEvent(new CustomEvent("manifestsReady"));
})();
