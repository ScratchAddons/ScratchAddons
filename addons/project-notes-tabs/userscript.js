import { eventTarget, getPreviewEnabled, addPreviewToggle } from "./module.js";

export default async function ({ addon, console }) {
  addon.tab
    .waitForElement(":root > body", {
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    })
    .then(() => {
      document.body.classList.add("sa-project-tabs-on");
    });

  function disableSelf() {
    document.querySelectorAll(".description-block").forEach((e) => (e.style.display = ""));
    wrapper.remove();
    document.body.classList.remove("sa-project-tabs-on");
    addPreviewToggle();
  }
  eventTarget.addEventListener("disable", disableSelf);
  addon.self.addEventListener("disabled", disableSelf);

  eventTarget.addEventListener("enable", injectTabs);
  addon.self.addEventListener("reenabled", injectTabs);
  addon.auth.addEventListener("change", () => {
    if (wrapper) injectTabs();
  });

  async function remixHandler() {
    while (true) {
      await addon.tab.waitForElement(".remix-credit", {
        markAsSeen: true,
        reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
      });
      projectNotes.insertBefore(wrapper, projectNotes.querySelector(".description-block"));
    }
  }

  let projectNotes;
  let tabs;
  let wrapper;

  function injectTabs() {
    if (addon.self.disabled || getPreviewEnabled()) {
      document.body.classList.remove("sa-project-tabs-on");
      return;
    }
    document.body.classList.add("sa-project-tabs-on");
    if (wrapper) wrapper.remove();
    const labels = document.querySelectorAll(".project-textlabel");
    const descriptions = document.querySelectorAll(".description-block");
    const tabButtons = [];
    const sectionCount = descriptions.length;

    wrapper = document.createElement("div");
    wrapper.classList = "sa-project-tabs-wrapper";
    projectNotes.insertBefore(wrapper, projectNotes.querySelector(".description-block"));
    tabs = document.createElement("div");
    wrapper.appendChild(tabs);
    tabs.classList.add("tabs-sa");

    if (!remixHandler.run) {
      remixHandler.run = true;
      remixHandler();
    }

    for (let i = 0; i < sectionCount; i++) {
      const tab = document.createElement("div");
      tab.classList.add("tab-choice-sa");
      const inner = document.createElement("span");
      inner.innerText = labels[i].querySelector("span").innerText;
      tab.appendChild(inner);
      tab.addEventListener("click", () => selectTab(i));
      tabButtons.push(tab);
      tabs.appendChild(tab);
    }

    function selectTab(index) {
      for (let i = 0; i < sectionCount; i++) {
        const selected = i === index;
        tabButtons[i].classList.toggle("tab-choice-selected-sa", selected);
        descriptions[i].style.display = selected ? "" : "none";
      }
    }

    selectTab(0);
    addPreviewToggle();
  }

  while (true) {
    projectNotes = await addon.tab.waitForElement(".project-notes", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });

    if (document.body.classList.contains("sa-project-tabs-on")) injectTabs();
  }
}
