export default async function ({ addon, console, msg }) {
  var maxLength = 5000;
  var className = "desc-limit";
  var area = "project";
  if (location.pathname.split("/").includes("studios")) {
    className = "studio-desc-limit";
    area = "studio";
  }

  var threshold = null;
  function updateThreshold() {
    if (addon.settings.get("display") === "low") {
      threshold = addon.settings.get("threshold");
    } else {
      threshold = Infinity;
    }
  }
  addon.settings.addEventListener("change", () => {
    updateThreshold();
  });
  updateThreshold();

  while (true) {
    if (area === "studio") {
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
      element.className = className + " limit-hidden";

      const counter = location.appendChild(element);

      function updateVisibility() {
        if (5000 - field.value.length <= threshold) {
          counter.className = className;
        } else {
          counter.className = className + " limit-hidden";
        }
      }

      // Show when textarea is focused, hide when focus leaves textarea
      field.addEventListener("focus", () => {
        if (addon.self.disabled) return;
        updateVisibility();
      });
      field.addEventListener("blur", () => {
        counter.className = className + " limit-hidden";
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

      addon.self.addEventListener("reenabled", () => {
        updateCounter();
      });
    }

    if (area === "studio") {
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
