function createStyle(url) {
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = url;
  return style;
}

export default async function ({ addon, console }) {
  const preview = await addon.tab.waitForElement(".markItUpPreviewFrame");
  const observer = new MutationObserver(function (records, observer) {
    for (let record of records) {
      if (record.type === "childList") {
        for (let node of record.addedNodes) {
          if (node.tagName === "LINK" && node.href.endsWith("djangobb_forum/css/pygments.css")) {
            preview.contentDocument.head.appendChild(createStyle(addon.self.dir + "/experimental_scratchr2.css"));
            preview.contentDocument.head.appendChild(createStyle(addon.self.dir + "/experimental_forums.css"));
            preview.contentDocument.head.appendChild(createStyle(addon.self.dir + "/pygments.css"));
          }
        }
      }
    }
  });
  observer.observe(preview.contentDocument, { subtree: true, childList: true });
  while (true) {
    await new Promise((resolve) => preview.addEventListener("load", resolve, { once: true }));
    observer.disconnect();
    observer.observe(preview.contentDocument, { subtree: true, childList: true });
  }
}
