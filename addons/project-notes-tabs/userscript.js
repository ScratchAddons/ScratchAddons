import { disableTabs, enableTabs } from "./module.js";

export default async function ({ addon, console }) {
  addon.tab
    .waitForElement(":root > body", {
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    })
    .then(() => {
      document.body.classList.add("sa-project-tabs-on");
    });

  addon.self.addEventListener("disabled", disableTabs);
  addon.self.addEventListener("reenabled", enableTabs);

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

  while (true) {
    projectNotes = await addon.tab.waitForElement(".project-notes", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });

    if (!document.body.classList.contains("sa-project-tabs-on")) continue; // We're disabled

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
        descriptions[i].classList.toggle("sa-tab-hide", !selected);
      }
    }

    selectTab(0);
  }
}
