export default async function ({ addon, console, msg }) {
  // Thanks to confirm-actions addon!
  let override = false;

  document.addEventListener(
    "click",
    (e) => {
      if (override) {
        override = false;
        return;
      }

      let type = null;

      if (
        addon.settings.get("sprites") &&
        (e.target.closest(
          "[class*='sprite-selector_sprite_'] > nav[class*='context-menu_context-menu_'] > :nth-child(3)"
        ) ||
          e.target.closest("div[class*='sprite-selector_sprite-wrapper_'] div[class*='delete-button_delete-button_']"))
      ) {
        type = "sprite";
      } else if (
        (addon.settings.get("sounds") &&
          e.target.closest("[data-tabs] > :nth-child(4) nav[class*='context-menu_context-menu_'] > :nth-child(3)")) ||
        e.target.closest("[data-tabs] > :nth-child(4) div[class*='delete-button_delete-button_']")
      ) {
        type = "sound";
      } else if (
        (addon.settings.get("costumes") &&
          e.target.closest("[data-tabs] > :nth-child(3) nav[class*='context-menu_context-menu_'] > :nth-child(3)")) ||
        e.target.closest("[data-tabs] > :nth-child(3) div[class*='delete-button_delete-button_']")
      ) {
        type = "costume";
      }

      if (type !== null) {
        e.preventDefault();
        e.stopPropagation();
        addon.tab
          .confirm(
            msg("delete-" + type + "-title"),
            msg("delete-" + type + "-message"),
            {
              okButtonLabel: msg("yes"),
              cancelButtonLabel: msg("no"),
              useEditorClasses: true,
            }
          )
          .then((confirmed) => {
            if (confirmed) {
              override = true;
              e.target.click();
            }
          });
      }
    },
    { capture: true }
  );
}
