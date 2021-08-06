export default async function ({ addon, global, console, msg }) {
  (async () => {
    while (true) {
      const reply = await addon.tab.waitForElement("li.reply", {
        markAsSeen: true,
        reduxCondition: (state) => {
          if (!state.scratchGui) return true;
          return state.scratchGui.mode.isPlayerOnly;
        },
      });

      console.log(reply);

      const topLevelComment = reply.parentNode.parentNode.querySelector("div.comment");

      const replyCount = await addon.tab.waitForElement(".actions-wrap .sa-comment-reply-count", {
        reduxCondition: (state) => {
          if (!state.scratchGui) return true;
          return state.scratchGui.mode.isPlayerOnly;
        },
        elementCondition: (el) => topLevelComment.contains(el),
      });

      let count = reply.parentNode.querySelectorAll("li.reply").length;
      replyCount.innerText = msg("replies", {
        count,
      });

      replyCount.setAttribute("data-count", reply.parentNode.childNodes.length);
      console.log("I've set the data-count!");

      count = [...reply.parentNode.querySelectorAll("li.reply")].indexOf(reply) + 1;

      const newElem = document.createElement("span");
      newElem.className = "actions report sa-comment-reply-count";
      newElem.innerText = `#${count}`;
      newElem.setAttribute("data-count", count);
      console.log("I've created the new element!");

      const actionList = await addon.tab.waitForElement(".replies .reply .actions-wrap", {
        markAsSeen: true,
        reduxCondition: (state) => (state.scratchGui ? state.scratchGui.mode.isPlayerOnly : true),
        elementCondition: (element) => element.parentNode == reply.firstElementChild,
      });
      console.log("I've found the action list!");

      actionList.insertBefore(newElem, actionList.querySelector("span[data-control='delete']"));
    }
  })();
  while (true) {
    const comment = await addon.tab.waitForElement("li.top-level-reply div.comment:not(.replies *)", {
      markAsSeen: true,
      reduxCondition: (state) => {
        if (!state.scratchGui) return true;
        return state.scratchGui.mode.isPlayerOnly;
      },
    });

    if (comment.querySelector("form")) continue;
    const newElem = document.createElement("span");
    newElem.className = "actions report sa-comment-reply-count";
    newElem.innerText = msg("replies", {
      count: 0,
    });
    newElem.setAttribute("data-count", 0);

    const actionList = await addon.tab.waitForElement(".top-level-reply div.comment .actions-wrap", {
      markAsSeen: true,
      reduxCondition: (state) => {
        if (!state.scratchGui) return true;
        return state.scratchGui.mode.isPlayerOnly;
      },
      elementCondition: (element) => comment.contains(element),
    });

    actionList.insertBefore(newElem, actionList.querySelector("span[data-control='delete']"));
  }
}
