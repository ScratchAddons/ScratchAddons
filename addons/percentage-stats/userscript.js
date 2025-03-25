export default async function ({ addon, console }) {
  let els = null;

  function getStats() {
    const stats = {
      views: els.views.innerHTML,
      loves: els.loves.innerHTML,
      favs: els.favs.innerHTML,
      remixes: els.remixes.innerHTML,
    };
    const realPercentages = {
      loves: (stats.loves / stats.views) * 100,
      favs: (stats.favs / stats.views) * 100,
      remixes: (stats.remixes / stats.views) * 100,
    };

    function modifyPercentages(stat) {
      if (realPercentages[stat] === 0) {
        return 0;
      } else if (realPercentages[stat] > 0 && Math.round(realPercentages[stat] * 10) / 10 === 0) {
        return "<0.1";
      } else {
        return Math.round(realPercentages[stat] * 10) / 10;
      }
    }
    const percentages = {
      loves: modifyPercentages("loves") + "%",
      favs: modifyPercentages("favs") + "%",
      remixes: modifyPercentages("remixes") + "%",
    };
    return percentages;
  }

  const modalL = document.createElement("div");
  modalL.className = "loves-modal";

  const modalF = document.createElement("div");
  modalF.className = "favs-modal";

  const modalR = document.createElement("div");
  modalR.className = "remixes-modal";

  function showModal(showKey) {
    let showModal;
    if (showKey === "loves") {
      showModal = modalL;
    } else if (showKey === "favs") {
      showModal = modalF;
    } else {
      showModal = modalR;
    }
    const rect = els[showKey].getBoundingClientRect();
    const modalMargin = 35;
    showModal.style.top = `${rect.top - modalMargin + window.scrollY}px`;
    showModal.style.left = `${rect.left}px`;
    showModal.innerText = getStats()[showKey];
    showModal.style.opacity = 1;
  }

  function hideModal(hideKey) {
    let hideModal;
    if (hideKey === "loves") {
      hideModal = modalL;
    } else if (hideKey === "favs") {
      hideModal = modalF;
    } else {
      hideModal = modalR;
    }
    hideModal.style.opacity = 0;
  }

  while (true) {
    await addon.tab.waitForElement(".stats", { markAsSeen: true });
    els = {
      views: document.querySelector(".project-views"),
      loves: document.querySelector(".project-loves"),
      favs: document.querySelector(".project-favorites"),
      remixes: document.querySelector(".project-remixes"),
    };
    document.body.appendChild(modalL);
    document.body.appendChild(modalF);
    document.body.appendChild(modalR);

    for (const key in els) {
      if (els.hasOwnProperty(key) && key !== "views") {
        els[key].addEventListener("mouseover", () => showModal(key));
        els[key].addEventListener("mouseout", () => hideModal(key));
        els[key].addEventListener("mousedown", () => {
          // Update modal on click of stat
          setTimeout(() => {
            showModal(key);
          }, 300);
        });
      }
    }
  }
}
