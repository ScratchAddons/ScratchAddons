import { pingifyTextNode } from "../../libraries/common/cs/fast-linkify.js";

export default async function ({ addon, console }) {
  const linkified = [];
  addon.self.addEventListener("disabled", () => unLinkifyMentions());
  addon.self.addEventListener("reenabled", () => linkifyMentions());
  addon.settings.addEventListener("change", () => {
    addon.settings.get("mentions") ? linkifyMentions() : unLinkifyMentions();
  });
  function linkifyMentions() {
    for (const { element } of linkified) {
      pingifyTextNode(element);
    }
  }
  function unLinkifyMentions() {
    for (const { element, original } of linkified) {
      element.innerHTML = original;
    }
  }
  function pingify(element) {
    linkified.push({
      element,
      original: element.innerHTML,
    });
    return pingifyTextNode(element);
  }
  while (true) {
    let post = await addon.tab.waitForElement(".post_body_html", { markAsSeen: true });
    if (!addon.self.disabled) pingify(post);
  }
}
