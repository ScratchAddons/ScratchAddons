//theme switching

const lightThemeLink = document.createElement("link");
lightThemeLink.setAttribute("rel", "stylesheet");
lightThemeLink.setAttribute("href", "light.css");

chrome.storage.sync.get(["globalTheme"], function (r) {
  let rr = false; //true = light, false = dark
  if (r.globalTheme) rr = r.globalTheme;
  if (rr) {
    document.head.appendChild(lightThemeLink);
  }
});
document.getElementById("settings").onclick = () => {
  chrome.runtime.openOptionsPage();
  setTimeout(() => window.close(), 100);
};

const popups = [
  {
    addonId: "scratch-messaging",
    icon: "../../images/icons/envelope.svg",
    name: `Messaging`,
    url: "scratch-messaging/popup.html",
    fullscreen: true,
  },
  {
    addonId: "cloud-games",
    icon: "../../images/icons/cloud.svg",
    name: "Games",
    url: "cloud-games/popup.html",
  },
];

let currentPopup = popups[0];

for (const popup of popups) {
  const el = document.createElement("div");
  el.classList.add("popup-name");
  el.setAttribute("data-id", popup.addonId);
  if (popup.icon) {
    const icon = document.createElement("img");
    icon.classList.add("popup-icon");
    icon.setAttribute("src", popup.icon);
    el.appendChild(icon);
  }
  const a = document.createElement("a");
  a.classList.add("popup-title");
  a.textContent = popup.name;
  el.appendChild(a);
  if (popup.fullscreen) {
    a.textContent += "\u00a0";
    const popoutA = document.createElement("a");
    popoutA.className = "popout";
    popoutA.href = `../../popups/${popup.url}`;
    popoutA.target = "_blank";
    popoutA.onclick = () => setTimeout(() => window.close(), 100);
    const img = document.createElement("img");
    img.src = "../../images/icons/popout.svg";
    img.className = "popout-img";
    img.title = "Open in new browser tab";
    popoutA.appendChild(img);
    el.appendChild(popoutA);
  }

  el.onclick = () => {
    if (currentPopup !== popup) setPopup(popup);
  };
  document.getElementById("popup-chooser").appendChild(el);
}

setPopup(currentPopup);

function setPopup(popup) {
  currentPopup = popup;
  document.getElementById("iframe").src = `../../popups/${popup.url}`;
  if (document.querySelector(".popup-name.sel")) document.querySelector(".popup-name.sel").classList.remove("sel");
  document.querySelector(`.popup-name[data-id="${popup.addonId}"]`).classList.add("sel");
}
var version = document.getElementById("version");
version.innerText = "v" + chrome.runtime.getManifest().version;
version.onclick = () => {
  window.open("https://scratchaddons.com/changelog?versionname=" + chrome.runtime.getManifest().version_name);
  setTimeout(() => window.close(), 100);
};
