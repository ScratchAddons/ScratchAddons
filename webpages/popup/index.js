document.getElementById("settings").onclick = () => {
  chrome.runtime.openOptionsPage();
  setTimeout(() => window.close(), 100);
};

const popups = [
  {
    addonId: "scratch-messaging",
    name: "✉️ Messaging",
    url: "scratch-messaging/popup.html",
    fullscreen: true,
  },
  {
    addonId: "cloud-games",
    name: "☁️ Games",
    url: "cloud-games/popup.html",
  },
];

let currentPopup = popups[0];

for (const popup of popups) {
  const el = document.createElement("div");
  el.classList.add("popup-name");
  el.setAttribute("data-id", popup.addonId);
  const a = document.createElement("a");
  a.textContent = popup.name;
  el.appendChild(a);
  if (popup.fullscreen) {
    a.textContent += "\u00a0";
    const popoutA = document.createElement("a");
    popoutA.id = "popout";
    popoutA.href = `../../popups/${popup.url}`;
    popoutA.target = "_blank";
    popoutA.onclick = () => setTimeout(() => window.close(), 100);
    const img = document.createElement("img");
    img.src = "./popout.png";
    img.title = "Open in new browser tab";
    popoutA.appendChild(img);
    el.appendChild(popoutA);
  }
  el.onclick = () => {if (currentPopup !== popup) setPopup(popup)};
  document.getElementById("popup-chooser").appendChild(el);
}

setPopup(currentPopup);

function setPopup(popup) {
  currentPopup = popup;
  document.getElementById("iframe").src = `../../popups/${popup.url}`;
  if (document.querySelector(".popup-name.sel")) document.querySelector(".popup-name.sel").classList.remove("sel");
  document.querySelector(`.popup-name[data-id="${popup.addonId}"]`).classList.add("sel");
}
