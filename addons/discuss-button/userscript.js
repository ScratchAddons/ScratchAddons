export default async function ({ addon, global, console }) {
  if (!addon.tab.clientVersion) return;

  const link = document.createElement("li");
  link.innerHTML = '<a href="/discuss">Discuss</a>';
  link.className = "link discuss";

  function scratchWww(el) {
    if (addon.settings.get("removeIdeasBtn")) el.getElementsByTagName("li")[3].remove();
    el.insertBefore(link, el.getElementsByTagName("li")[3]);
    el.classList.add("discuss-button-added");
  }

  if (addon.tab.clientVersion === "scratch-www") {
    const check = () => {
      return new Promise(async (resolve) => {
        const el = await addon.tab.waitForElement(
          "div#navigation div.inner ul:not(.discuss-button-added):not(.production)"
        );
        scratchWww(el);
        setTimeout(resolve, 1000);
      });
    };
    check();
    if (addon.tab.editorMode) {
      // On a project
      while (true) {
        await check();
      }
    } else check();
  } else {
    const el = await addon.tab.waitForElement("div#topnav ul.site-nav");
    if (addon.settings.get("removeIdeasBtn")) el.getElementsByTagName("li")[2].remove();
    el.insertBefore(link, el.getElementsByTagName("li")[2]);
  }
}
