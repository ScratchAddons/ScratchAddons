export default async function ({ addon, msg }) {
  const enableSwitcher = document.createElement("button");
  const enableSwitcherText = document.createElement("span");
  enableSwitcher.id = "sa-preview-notes-instructions";
  enableSwitcher.classList.add("button", "action-button", "sa-preview-desc");
  enableSwitcher.addEventListener("click", () => togglePreview());
  enableSwitcher.appendChild(enableSwitcherText);

  let currentlyEnabled = false;

  while (true) {
    // Same waitForElement call as animated-thumb/userscript.js
    await addon.tab.waitForElement(".flex-row.subactions > .flex-row.action-buttons", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });

    // Skip if user cannot edit the project title.
    // Same logic as animated-thumb/userscript.js
    if (!document.querySelector(".form-group.project-title")) continue;

    addon.tab.appendToSharedSpace({
      space: "afterCopyLinkButton",
      order: 1,
      element: enableSwitcher,
    });
    togglePreview(false);
    currentlyEnabled = false;
  }

  /**
   * Will attempt to toggle between the off and on states, however an override can be passed
   * which will completely override the current value
   * @param {boolean} override Force to a specific value.
   * @returns {void}
   */
  function togglePreview(override = !currentlyEnabled) {
    enableSwitcherText.innerText = override ? msg("Disable") : msg("Enable");
    currentlyEnabled = override;

    // TODO
  }
}
