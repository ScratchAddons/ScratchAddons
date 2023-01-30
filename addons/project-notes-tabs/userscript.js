export default async function ({ addon, console }) {
  async function remixHandler() {
    while (true) {
      await addon.tab.waitForElement(".remix-credit", {
        markAsSeen: true,
        reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
      });
      projectNotes.insertBefore(tabs, projectNotes.querySelector(".description-block"));
    }
  }

  let projectNotes;
  let tabs;

  while (true) {
    projectNotes = await addon.tab.waitForElement(".project-notes", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });

    const labels = document.querySelectorAll(".project-textlabel");
    const descriptions = document.querySelectorAll(".description-block");
    const tabButtons = [];
    const sectionCount = descriptions.length;
    for (const label of labels) {
      label.remove();
    }

    tabs = projectNotes.insertBefore(document.createElement("div"), projectNotes.querySelector(".description-block"));
    tabs.classList.add("tabs-sa");

    if (!remixHandler.run) {
      remixHandler.run = true;
      remixHandler();
    }

    for (let i = 0; i < sectionCount; i++) {
      const tab = document.createElement("div");
      tab.classList.add("tab-choice-sa");
      const inner = document.createElement("span");
      inner.innerText = labels[i].innerText;
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
  }
}
