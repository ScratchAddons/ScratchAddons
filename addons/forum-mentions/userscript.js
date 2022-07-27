import { pingifyTextNode } from "../../libraries/common/cs/fast-linkify.js";

export default async function ({ addon, console }) {
  while (true) {
    let post = await addon.tab.waitForElement(".post_body_html", { markAsSeen: true });
    pingifyTextNode(post);
  }
}

