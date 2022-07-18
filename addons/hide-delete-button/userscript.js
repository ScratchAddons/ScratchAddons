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
      
      if ( addon.settings.get("sprites") && e.target.closest("div[class*='sprite-selector_sprite-wrapper_'] div[class*='delete-button_delete-button_']") ) {
        type = "sprite";
      } else if (addon.settings.get("sounds") && e.target.closest("[data-tabs] > :nth-child(5) div[class*='delete-button_delete-button_']")) {
        type = "sound";
      } else if (addon.settings.get("costumes") && e.target.closest("[data-tabs] > :nth-child(3) div[class*='delete-button_delete-button_']")) {
        type = "costume";
      }

      if (type !== null) {
        e.preventDefault();
        e.stopPropagation();
        addon.tab
          .confirm(msg("confirm-title", {object: msg(type)}), msg("confirm-message", {object: msg(type)}), {
            okButtonLabel: msg("yes"),
            cancelButtonLabel: msg("no"),
            useEditorClasses: true,
          })
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
