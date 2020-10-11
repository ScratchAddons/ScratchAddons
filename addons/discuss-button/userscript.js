export default async function ({ addon, global, console }) {
  if (!addon.tab.clientVersion) return;

  const link = document.createElement("li");
  link.className = "link discuss";
  const a = document.createElement("a");
  a.href = "/discuss";
  a.textContent = addon.settings.get("buttonName");
  link.appendChild(a);

  if (addon.tab.clientVersion === "scratch-www") {
    while (true) {
      const el = await addon.tab.waitForElement("div#navigation div.inner ul:not(.production)", { markAsSeen: true });
      if (addon.settings.get("removeIdeasBtn")) el.getElementsByTagName("li")[3].remove();
      el.insertBefore(link, el.getElementsByTagName("li")[3]);
    }
  } else {
    const el = await addon.tab.waitForElement("div#topnav ul.site-nav");
    if (addon.settings.get("removeIdeasBtn")) el.getElementsByTagName("li")[2].remove();
    el.insertBefore(link, el.getElementsByTagName("li")[2]);
  }
}
