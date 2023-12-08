const CHANGE_TO_YT = 0;
const RESTORE_DISCUSS_URL = 1;

const YT_LINK_SELECTOR = 'a[href^="https://scratch.mit.edu/discuss/youtube/"], a[href^="/discuss/youtube/"]';

export default async function ({ addon, console }) {
  function handleLink(el, mode) {
    if (mode === CHANGE_TO_YT) {
      el.href = el.href.replace("https://scratch.mit.edu/discuss/youtube/", "https://www.youtube.com/watch?v=");
    } else if (mode === RESTORE_DISCUSS_URL) {
      el.href = el.href.replace("https://www.youtube.com/watch?v=", "https://scratch.mit.edu/discuss/youtube/");
    }
  }

  const changedLinks = [];

  addon.self.addEventListener("disabled", () => {
    for (const link of changedLinks) handleLink(link, RESTORE_DISCUSS_URL);
  });

  addon.self.addEventListener("reenabled", () => {
    for (const link of document.querySelectorAll(YT_LINK_SELECTOR)) {
      handleLink(link, CHANGE_TO_YT);
    }
  });

  while (true) {
    const link = await addon.tab.waitForElement(YT_LINK_SELECTOR, {
      markAsSeen: true,
      reduxCondition: (state) => {
        if (!state.scratchGui) return true;
        return state.scratchGui.mode.isPlayerOnly;
      },
    });
    if (!addon.self.disabled) {
      handleLink(link, CHANGE_TO_YT);
      changedLinks.push(link);
    }
  }
}
