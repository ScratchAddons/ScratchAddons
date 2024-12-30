import { textColor, multiply, brighten } from "../../libraries/common/cs/text-color.esm.js";

function createStyle(url, disabled) {
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = url;
  if (disabled) style.disabled = true;
  return style;
}

function updateCssVariables(node, addon) {
  if (node === undefined) return;
  if (addon.self.disabled) {
    node.style.setProperty("--darkWww-page", "#ffffff");
    node.style.setProperty("--darkWww-page-scratchr2Text", "#322f31");
    node.style.setProperty("--darkWww-page-colorScheme", "light");
    node.style.setProperty("--darkWww-link", "#855cd6");
    node.style.setProperty("--darkWww-gray-scratchr2", "#f7f7f7");
    node.style.setProperty("--darkWww-gray-scratchr2Text", "#322f31");
    node.style.setProperty("--darkWww-border-15", "#cccccc");
    const pygmentsStyle = node.querySelector("link[href$='dark-www/pygments.css']");
    if (pygmentsStyle) pygmentsStyle.disabled = true;
    return;
  }
  node.style.setProperty("--darkWww-page", addon.settings.get("box"));
  node.style.setProperty("--darkWww-page-scratchr2Text", textColor(addon.settings.get("box"), "#322f31"));
  node.style.setProperty("--darkWww-page-colorScheme", textColor(addon.settings.get("box"), "light", "dark"));
  const linkColor = addon.settings.get("link");
  node.style.setProperty("--darkWww-link-scratchr2", linkColor.startsWith("#4d97ff") ? "#1aa0d8" : linkColor);
  node.style.setProperty(
    "--darkWww-gray-scratchr2",
    textColor(
      addon.settings.get("gray"),
      brighten(addon.settings.get("gray"), { r: 0.62, g: 0.62, b: 0.62 }),
      addon.settings.get("gray"),
      241
    )
  );
  node.style.setProperty("--darkWww-gray-scratchr2Text", textColor(addon.settings.get("gray"), "#322f31"));
  node.style.setProperty("--darkWww-border-15", brighten(addon.settings.get("border"), { a: 0.94 }));
  const pygmentsStyle = node.querySelector("link[href$='dark-www/pygments.css']");
  if (pygmentsStyle) pygmentsStyle.disabled = !addon.settings.get("darkForumCode");
}

export default async function ({ addon, console }) {
  let previewRoot;
  addon.settings.addEventListener("change", () => updateCssVariables(previewRoot, addon));
  addon.self.addEventListener("disabled", () => updateCssVariables(previewRoot, addon));
  addon.self.addEventListener("reenabled", () => updateCssVariables(previewRoot, addon));
  while (true) {
    const preview = await addon.tab.waitForElement(".markItUpPreviewFrame", { markAsSeen: true });
    const observer = new MutationObserver(function (records, observer) {
      for (let record of records) {
        if (record.type === "childList") {
          for (let node of record.addedNodes) {
            if (node.tagName === "HTML") {
              updateCssVariables(node, addon);
              previewRoot = node;
            }
            if (node.tagName === "LINK" && node.href.endsWith("djangobb_forum/css/pygments.css")) {
              preview.contentDocument.head.appendChild(createStyle(addon.self.dir + "/experimental_scratchr2.css"));
              preview.contentDocument.head.appendChild(
                createStyle(addon.self.dir + "/pygments.css", !addon.settings.get("darkForumCode"))
              );
            }
          }
        }
      }
    });
    observer.observe(preview.contentDocument, { subtree: true, childList: true });
    preview.addEventListener("load", () => {
      observer.disconnect();
      observer.observe(preview.contentDocument, { subtree: true, childList: true });
    });
  }
}
