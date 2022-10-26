import { linkifyTextNode as linkifyNode, linkifyTag as _linkifyTag } from "../../libraries/common/cs/fast-linkify.js";

export default async function ({ addon, console }) {
  const pageType = document.location.pathname.substring(1).split("/")[0];
  const linkified = [];
  addon.self.addEventListener("disabled", () => {
    for (const { element, original } of linkified) {
      element.innerHTML = original;
    }
  });
  addon.self.addEventListener("reenabled", () => {
    for (const { element, constructor, type } of linkified) {
      if (type === "tag") {
        _linkifyTag(element, constructor);
      } else {
        linkifyNode(element);
      }
    }
  });

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

  function linkifyTextNode(element) {
    linkified.push({
      element,
      original: element.innerHTML,
      type: "node",
    });
    return linkifyNode(element);
  }
  function linkifyTag(element, constructor) {
    linkified.push({
      element,
      original: element.innerHTML,
      type: "tag",
      constructor,
    });
    return _linkifyTag(element, constructor);
  }
}
