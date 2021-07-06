import { linkifyTextNode, linkifyTag } from "../../libraries/common/cs/fast-linkify.js";

export default async function ({ addon, console }) {
  const pageType = document.location.pathname.substr(1).split("/")[0];

  switch (pageType) {
    case "users":
      document.querySelectorAll("p.overview").forEach((element) => linkifyTextNode(element));
      break;

    case "projects":
      (async () => {
        while (true) {
          let element = await addon.tab.waitForElement(".project-description", {
            markAsSeen: true,
            reduxCondition: (state) => {
              if (!state.scratchGui) return true;
              return state.scratchGui.mode.isPlayerOnly;
            },
          });
          // Need to convert #[numbers] to solve conflict between tags and external Scratch player links.
          document.querySelectorAll(".project-description a").forEach((element) => {
            if (/^#\d+$/.test(element.textContent) && element.previousSibling instanceof Text) {
              element.previousSibling.textContent += element.textContent;
              element.remove();
            }
          });
          element.normalize();
          linkifyTextNode(element);
        }
      })();
      break;

    case "studios": {
      const desc = document.querySelector("div.studio-description");
      if (!desc) break;
      linkifyTextNode(desc);
      break;
    }
  }

  (async () => {
    if (addon.tab.clientVersion === "scratchr2") {
      while (true) {
        let comment = await addon.tab.waitForElement(".comment .content", { markAsSeen: true });
        // scratchr2 comment is a simple linkifyTextNode.
        linkifyTextNode(comment);
      }
    } else {
      while (true) {
        let comment = await addon.tab.waitForElement("span.comment-content", {
          markAsSeen: true,
          reduxCondition: (state) => {
            if (!state.scratchGui) return true;
            return state.scratchGui.mode.isPlayerOnly;
          },
        });
        // scratch-www comment is <span>-based.
        linkifyTag(comment, HTMLSpanElement);
      }
    }
  })();
}
