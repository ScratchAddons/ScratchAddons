export default async function (translations = false) {
  chrome = chrome.pollyfilled ? chrome : (await import("../libraries/common/chrome.js")).default;
  const folderNames = await (await fetch(chrome.runtime.getURL("addons/addons.json"))).json()

  if (translations && typeof scratchAddons === "object") await scratchAddons.l10n?.load(folderNames);
  const useDefault = typeof scratchAddons === "object" ? scratchAddons.l10n?.locale?.startsWith("en") ?? true : true;

  const manifests = [];

  manifests.push(
    ...(await Promise.all(
      folderNames.map(async (folderName) => {
        return fetch(chrome.runtime.getURL(`addons/${folderName}/addon.json`))
          .then((res) => res.json())
          .then((manifest) => {
            if (translations && !useDefault) {
              manifest._english = {};
              for (const prop of ["name", "description"]) {
                if (manifest[prop]) {
                  manifest._english[prop] = manifest[prop];
                  manifest[prop] = scratchAddons.l10n.get(`${folderName}/@${prop}`, {}, manifest[prop]);
                }
              }
              for (const info of manifest.info || []) {
                info.text = scratchAddons.l10n.get(`${folderName}/@info-${info.id}`, {}, info.text);
              }
              if (manifest.popup) {
                manifest.popup.name = scratchAddons.l10n.get(`${folderName}/@popup-name`, {}, manifest.popup.name);
              }
              for (const preset of manifest.presets || []) {
                for (const prop of ["name", "description"]) {
                  if (preset[prop]) {
                    preset[prop] = scratchAddons.l10n.get(
                      `${folderName}/@preset-${prop}-${preset.id}`,
                      {},
                      preset[prop]
                    );
                  }
                }
              }
              for (const option of manifest.settings || []) {
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
                    usersIcon: "@users.svg",
                  },
                  option.name
                );

                switch (option.type) {
                  case "string":
                    option.default = scratchAddons.l10n.get(
                      `${folderName}/@settings-default-${option.id}`,
                      {},
                      option.default
                    );
                    break;
                  case "select":
                    option.potentialValues = option.potentialValues.map((value) => {
                      if (value && value.id) {
                        value.name = scratchAddons.l10n.get(
                          `${folderName}/@settings-select-${option.id}-${value.id}`,
                          {},
                          value.name
                        );
                        return value;
                      }
                      return { name: value, id: value };
                    });
                    break;
                }
              }
            }

            for (const propName of ["userscripts", "userstyles"]) {
              for (const injectable of manifest[propName] || []) {
                const { matches } = injectable;
                if (typeof matches === "string" && matches.startsWith("^")) {
                  injectable._scratchDomainImplied = !matches.startsWith("^https:");
                  injectable.matches = new RegExp(matches, "u");
                } else if (Array.isArray(matches)) {
                  for (let i = matches.length; i--; ) {
                    const match = matches[i];
                    if (typeof match === "string" && match.startsWith("^")) {
                      matches[i] = new RegExp(match, "u");
                      matches[i]._scratchDomainImplied = !match.startsWith("^https:");
                    }
                  }
                }
              }
            }
            return { addonId: folderName, manifest };
          });
      })
    ))
  );

  return manifests;
}
