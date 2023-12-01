export default async function ({ addon, console }) {
  function getStats() {
    const stats = {
      views: els.views.innerHTML,
      loves: els.loves.innerHTML,
      favs: els.favs.innerHTML,
      remixes: els.remixes.innerHTML,
    };
    return {
      loves: Math.round((stats.loves / stats.views) * 100) + "%",
      favs: Math.round((stats.favs / stats.views) * 100) + "%",
      remixes: Math.round((stats.remixes / stats.views) * 100) + "%",
    };
  }

  await addon.tab.waitForElement(".stats");
  const els = {
    views: document.querySelector(".project-views"),
    loves: document.querySelector(".project-loves"),
    favs: document.querySelector(".project-favorites"),
    remixes: document.querySelector(".project-remixes"),
  };

  const modalL = document.createElement("div");
  modalL.className = "loves-modal";
  document.body.appendChild(modalL);

  const modalF = document.createElement("div");
  modalF.className = "favs-modal";
  document.body.appendChild(modalF);

  const modalR = document.createElement("div");
  modalR.className = "remixes-modal";
  document.body.appendChild(modalR);

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
    const modalMargin = 30;
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
