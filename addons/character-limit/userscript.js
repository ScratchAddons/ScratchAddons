export default async function ({ addon, console, msg }) {
  const CLASS_NAME = "desc-limit project";
  const AREA = location.pathname.split("/")[1] === "studios" ? "studio" : "project";
  let maxLength = 5000;

  let threshold = null;
  function updateThreshold() {
    threshold = addon.settings.get("display") === "low" ? addon.settings.get("threshold") : Infinity;
  }
  addon.settings.addEventListener("change", updateThreshold);
  updateThreshold();

  while (true) {
    if (AREA === "studio") {
      await addon.tab.waitForElement(".inplace-textarea.studio-description", {
        markAsSeen: true,
      });
    } else {
      await addon.tab.waitForElement(".project-description-edit.last", {
        markAsSeen: true,
        reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
      });
    }

    function newCharLimitCounter(field) {
      const element = document.createElement("span");
      element.textContent = msg("left", { num: maxLength });
      element.className = CLASS_NAME + " limit-hidden";

      function updateVisibility() {
        if (maxLength - field.value.length <= threshold) {
          element.classList.remove("limit-hidden");
        } else {
          element.classList.add("limit-hidden");
        }
      }

      // Show when textarea is focused, hide when focus leaves textarea
      field.addEventListener("focus", () => {
        if (addon.self.disabled) return;
        updateVisibility();
      });
      field.addEventListener("blur", () => {
        element.classList.add("limit-hidden");
      });

      function updateCounter() {
        element.textContent = msg("left", { num: maxLength - field.value.length });
      }

      // Re-count as text is entered or removed
      field.addEventListener("input", () => {
        if (addon.self.disabled) return;
        updateCounter();
        updateVisibility();
      });
      updateCounter();

      addon.tab.displayNoneWhileDisabled(element);
      addon.self.addEventListener("reenabled", updateCounter);

      return element;
    }

    // Place the character limit display and tie it to its corresponding text field
    if (AREA === "studio") {
      // Studio page
      document
        .getElementsByClassName("studio-info-section")[3]
        .appendChild(newCharLimitCounter(document.querySelector(".inplace-textarea.studio-description")));
    } else if (document.body.classList.contains("sa-project-tabs-on")) {
      // Project page with project-notes-tabs
      await addon.tab.waitForElement(".tabs-sa", { markAsSeen: true });
      document
        .querySelector(".tabs-sa")
        .after(
          newCharLimitCounter(document.querySelector("textarea")),
          newCharLimitCounter(document.querySelector(".last textarea"))
        );
    } else {
      // Normal project page
      const labels = document.querySelectorAll(".project-textlabel > :first-child");
      labels[0].after(newCharLimitCounter(document.querySelector("textarea"))); // Instructions
      labels[1].after(newCharLimitCounter(document.querySelector(".last textarea"))); // Notes and Credits
    }
  }
}
