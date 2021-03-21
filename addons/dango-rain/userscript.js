let dangorain = false,
  dangoContainerLeft,
  dangoContainerRight,
  vissiableDangos,
  noticeTimeout;
const div = () => document.createElement("div");
const noticeText = div();
noticeText.className = "sa-dango-notice";

const checkForDango = (text) => {
  text = text.value || text.textContent;
  if (!text.includes("dango")) {
    if (dangorain && dangoContainerLeft) {
      dangoContainerLeft?.remove();
      dangoContainerRight?.remove();
      noticeText?.remove();
    }
    dangorain = false;
    return;
  }
  if (dangorain) return;
  dangorain = true;
  dangoContainerLeft = div();
  dangoContainerLeft.className = "sa-dangos-left";
  for (let i = 0; i < 20; i++) {
    const dango = div();
    dango.className = "sa-dango";
    dango.style.left = (i % 10) * 10 + "%";
    dango.style.animationDelay = `${Math.random() * 8}s, ${Math.random() * 8}s`;
    dangoContainerLeft.append(dango);
  }
  setEltWidth(dangoContainerLeft);

  dangoContainerRight = dangoContainerLeft.cloneNode(true);
  dangoContainerRight.className = "sa-dangos-right";

  document.querySelector("#content").append(dangoContainerLeft, dangoContainerRight);
  if (!localStorage.getItem("scratchAddonsAprilFoolsModal2021")) document.querySelector("#content").append(noticeText);
};
const setEltWidth = (elt) => {
  if (!elt) return;
  let sideWidth = (document.body.clientWidth - document.querySelector("#profile-data").clientWidth) / 2;
  sideWidth = (sideWidth - 25);
  elt.style.width = sideWidth + "px";
  let old = vissiableDangos;
  vissiableDangos = sideWidth > 0;
  if (vissiableDangos) {
    clearTimeout(noticeTimeout);
    if (!old && !localStorage.getItem("scratchAddonsAprilFoolsModal2021")) {
      document.querySelector("#content").append(noticeText);
    }
  } else {
    // Window resizing is very weird on some devices...
    // Some devices might make the notice text "flicker".
    clearTimeout(noticeTimeout);
    noticeTimeout = setTimeout(() => {
      noticeText?.remove();
    }, 1000);
  }
};
addEventListener("resize", () => {
  setEltWidth(dangoContainerLeft);
  setEltWidth(dangoContainerRight);
});

export default async function ({ addon, global, console, msg }) {
  const notifClose = Object.assign(document.createElement("span"), {
    style: `
    float: right;
    cursor:pointer;
    background-color: #ffffff26;
    line-height: 10px;
    width: 10px;
    text-align: center;
    padding:5px;
    border-radius: 50%;`,
    textContent: "x",
  });
  notifClose.onclick = () => {
    noticeText.style.display = "none";
    localStorage.setItem("scratchAddonsAprilFoolsModal2021", "true");
  };
  noticeText.appendChild(notifClose);
  const boldSpan = document.createElement("span");
  boldSpan.innerText = msg("addedBy");
  boldSpan.style.fontWeight = "bold";
  noticeText.appendChild(boldSpan);
  const normalSpan = document.createElement("span");
  normalSpan.innerText = `\n${msg("happyAprilFools")}\n${msg("howToGet")}\n${msg("howToStop")}`;
  noticeText.appendChild(normalSpan);
  
  const now = new Date().getTime() / 1000;
  const runDangos = addon.settings.get("force") || (now < 1617364800 && now > 1617192000);
  if (!runDangos) return;
  while (true) {
    const bio = await addon.tab.waitForElement('.overview, [name="bio"]', { markAsSeen: true });
    checkForDango(bio);
    bio.oninput = () => checkForDango(bio);
  }
}
