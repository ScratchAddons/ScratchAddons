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

    case "messages":
      while (true) {
        const message = await addon.tab.waitForElement(".comment-text p", { markAsSeen: true });

        if (message.textContent.length === 250) {
          console.log(message);
          // The message is truncated (unless it happens to be ecxactly 250 characters long), and so links may break. We now fetch the rest of the text for link making

          const username = await addon.auth.fetchUsername();

          const messageInfo = message.parentElement.parentElement.parentElement.firstChild;
          const link = messageInfo.querySelector("a:not(.social-messages-profile-link)").href;

          async function getContentFromResponse(response, message) {
            const blob = await response.blob();
            const usableResponse = JSON.parse(await blob.text());

            // Yes, using innerHTML here, this is so the browser can handle things like &apos; for a comma
            message.innerHTML = usableResponse.content;
          }

          if (link.includes("projects")) {
            const regex = /\/projects\/(\d+)\/#comments-(\d+)/;
            const match = link.match(regex);

            const projectId = match[1];
            const commentId = match[2];

            const response = await fetch(
              `https://api.scratch.mit.edu/users/${username}/projects/${projectId}/comments/${commentId}`
            );

            await getContentFromResponse(response, message);
          } else if (link.includes("studios")) {
            const regex = /\/studios\/(\d+)\/comments\/#comments-(\d+)/;
            const match = link.match(regex);

            const studioId = match[1];
            const commentId = match[2];

            const response = await fetch(`https://api.scratch.mit.edu/studios/${studioId}/comments/${commentId}`);

            await getContentFromResponse(response, message);
          }
        }
        linkifyTextNode(message);
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
