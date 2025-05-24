export default async function ({ addon, console, msg }) {
  const CLASS_NAME = "desc-limit project";
  const AREA = location.pathname.split("/")[1] === "studios" ? "studio" : "project";
  let maxLength = 5000;

  let threshold = null;
  function updateThreshold() {
    threshold = addon.settings.get("display") === "low" ? addon.settings.get("threshold") : Infinity
  }
  addon.settings.addEventListener("change", updateThreshold);
  updateThreshold();

  while (true) {
    if (AREA === "studio") {
      await addon.tab.waitForElement(".inplace-textarea.studio-description", {
        markAsSeen: true,
      });
    } else {
      await addon.tab.waitForElement(".project-notes", {
        markAsSeen: true,
        reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
      });

      if (!document.querySelector('[id*="frc-instructions"].inplace-textarea')) {
        return;
      }
    }

    function newCharLimitCounter(location, field) {
      const element = document.createElement("span");
      element.textContent = msg("left", { num: maxLength });
      element.className = CLASS_NAME + " limit-hidden";

      const counter = location.appendChild(element);

      function updateVisibility() {
        if (maxLength - field.value.length <= threshold) {
          counter.className = CLASS_NAME;
        } else {
          counter.className = CLASS_NAME + " limit-hidden";
        }
      }

      // Show when textarea is focused, hide when focus leaves textarea
      field.addEventListener("focus", () => {
        if (addon.self.disabled) return;
        updateVisibility();
      });
      field.addEventListener("blur", () => {
        counter.className = CLASS_NAME + " limit-hidden";
      });

      addon.tab.displayNoneWhileDisabled(counter);

      function updateCounter() {
        counter.textContent = msg("left", { num: maxLength - field.value.length });
      }

      // Re-count as text is entered or removed
      field.addEventListener("input", () => {
        if (addon.self.disabled) return;
        updateCounter();
        updateVisibility();
      });
      updateCounter();

      addon.self.addEventListener("reenabled", updateCounter);
    }

    if (AREA === "studio") {
      // Studio Description
      newCharLimitCounter(
        document.getElementsByClassName("studio-info-section")[3],
        document.querySelector(".inplace-textarea.studio-description")
      );
    } else {
      // Project Page > Instructions
      newCharLimitCounter(document.querySelector(".project-textlabel"), document.getElementsByName("instructions")[0]);

      // Project Page > Notes and Credits
      newCharLimitCounter(
        document.querySelectorAll(".project-textlabel")[1],
        document.querySelector('textarea[name="description"]')
      );
    }
  }
}
