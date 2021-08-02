export default async function ({ addon, global, console, msg }) {
  (async () => {
    while (true) {
      const reply = await addon.tab.waitForElement(".replies div.comment", {
        markAsSeen: true,
        reduxCondition: (state) => {
          if (!state.scratchGui) return true;
          return state.scratchGui.mode.isPlayerOnly;
        },
      });

      const topLevelComment = reply.parentNode.parentNode.childNodes[0];

      const replyCount = await addon.tab.waitForElement(".action-list .sa-comment-reply-count", {
        reduxCondition: (state) => {
          if (!state.scratchGui) return true;
          return state.scratchGui.mode.isPlayerOnly;
        },
        elementCondition: (el) => topLevelComment.contains(el),
      });

      let count = reply.parentNode.childNodes.length;
      const moreRepliesToLoad = count !== reply.parentNode.querySelectorAll("div.comment").length;

      if (moreRepliesToLoad) count--
      
      replyCount.innerText = msg("replies", {
        count,
      });

      if (moreRepliesToLoad) replyCount.innerText.replace(`${count}`, `${count}+`);

      replyCount.setAttribute("data-count", reply.parentNode.childNodes.length);

      const newElem = document.createElement("span");
      newElem.className = "comment-delete sa-comment-reply-count";
      newElem.innerText = `#${[].slice.apply(reply.parentNode.childNodes).indexOf(reply) + 1}`;
      newElem.setAttribute("data-count", 0);

      const actionList = await addon.tab.waitForElement(".replies div.comment .action-list", {
        markAsSeen: true,
        reduxCondition: (state) => {
          if (!state.scratchGui) return true;
          return state.scratchGui.mode.isPlayerOnly;
        },
        elementCondition: (element) => reply.contains(element),
      });

      actionList.appendChild(newElem);
    }
  })();
  while (true) {
    const comment = await addon.tab.waitForElement("div.comment:not(.replies .comment)", {
      markAsSeen: true,
      reduxCondition: (state) => {
        if (!state.scratchGui) return true;
        return state.scratchGui.mode.isPlayerOnly;
      },
    });

    if (comment.querySelector("form")) continue;
    const newElem = document.createElement("span");
    newElem.className = "comment-delete sa-comment-reply-count";
    newElem.innerText = msg("replies", {
      count: 0,
    });
    newElem.setAttribute("data-count", 0);

    const actionList = await addon.tab.waitForElement("div.comment:not(.replies .comment) .action-list", {
      markAsSeen: true,
      reduxCondition: (state) => {
        if (!state.scratchGui) return true;
        return state.scratchGui.mode.isPlayerOnly;
      },
      elementCondition: (element) => comment.contains(element),
    });

    actionList.appendChild(newElem);
  }
}
