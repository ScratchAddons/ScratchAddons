import { eventTarget, addPreviewToggle, disableTabs } from "./module.js";

export default async function ({ addon, console }) {
  addon.tab
    .waitForElement(":root > body", {
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    })
    .then(() => {
      document.body.classList.add("sa-project-tabs-on");
    });

  function enableSelf() {
    if (addon.self.disabled) return;
    document.body.classList.add("sa-project-tabs-on");
    selectTab(0);
  }
  eventTarget.addEventListener("enable", enableSelf);

  addon.self.addEventListener("disabled", () => {
    disableTabs();
    addPreviewToggle();
  });
  addon.self.addEventListener("reenabled", () => {
    enableSelf();
    addPreviewToggle();
  });

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
  let sectionCount;
  const tabButtons = [];

  function selectTab(index) {
    const descriptions = document.querySelectorAll(".description-block");
    for (let i = 0; i < sectionCount; i++) {
      const selected = i === index;
      tabButtons[i].classList.toggle("tab-choice-selected-sa", selected);
      descriptions[i].style.display = selected ? "" : "none";
    }
  }

  function injectTabs() {
    if (wrapper) wrapper.remove();
    const labels = document.querySelectorAll(".project-textlabel");
    const descriptions = document.querySelectorAll(".description-block");
    tabButtons.length = 0;
    sectionCount = descriptions.length;

    wrapper = document.createElement("div");
    wrapper.classList = "sa-project-tabs-wrapper";
    addon.tab.displayNoneWhileDisabled(wrapper);
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
