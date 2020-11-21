export default async function ({ addon, global, console }) {
  while (true) {
    let projectNotes = await addon.tab.waitForElement(".project-notes", { markAsSeen: true });
    let allLabels = document.querySelectorAll(".project-textlabel").length;
    for (let i = 0; i < allLabels; i++) {
      document.querySelector(".project-textlabel").remove();
    }
    let tabs = projectNotes.insertBefore(
      document.createElement("div"),
      projectNotes.querySelector(".description-block")
    );
    tabs.classList.add("tabs-sa");
    tabs.style.marginBottom = "0px"
    if (allLabels - 1) {
      let intTab = tabs.appendChild(document.createElement("div"));
      intTab.classList.add("tab-choice-sa");
      let innerTab = intTab.appendChild(document.createElement("span"));
      innerTab.innerText = "Instructions";
      intTab.style.marginLeft = "5px"
    }
    let notesTab = tabs.appendChild(document.createElement("div"));
    notesTab.classList.add("tab-choice-sa");
    let innerTab = notesTab.appendChild(document.createElement("span"));
    innerTab.innerText = "Notes and Credits";
    if (!(allLabels - 1)) notesTab.style.marginLeft = "5px"
    for (var i = 0; i < tabs.querySelectorAll(".tab-choice-sa").length; i++) {
      tabs.querySelectorAll(".tab-choice-sa")[i].addEventListener("click", function (e) {
        selectTab((e.path[0].classList.length ? e.path[0].children[0] : e.path[0]).innerText == "Instructions" ? 0 : 1);
      });
    }
    selectTab(0);
    function selectTab(tab) {
      tabs.querySelectorAll(".tab-choice-sa")[tab].classList.add("sa-selected");
      tabs.querySelectorAll(".tab-choice-sa")[!tab + 0].classList.remove("sa-selected");
      document.querySelectorAll(".description-block")[tab].style.marginBottom = "0rem"
      document.querySelectorAll(".description-block")[!tab + 0].style.display = "none"
    }
  }
}
