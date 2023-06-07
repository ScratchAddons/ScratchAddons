export default async function ({ addon, console }) {
  let changedLinks = [];
  addon.self.addEventListener("disabled", () => {
    changedLinks.forEach((link) => {
      link.href = link.href.replace("https://www.youtube.com/watch?v=", "https://scratch.mit.edu/discuss/youtube/");
    });
    changedLinks = [];
  });
  while (true) {
    const el = await addon.tab.waitForElement(
      'a[href^="https://scratch.mit.edu/discuss/youtube/"], a[href^="/discuss/youtube/"]',
      {
        reduxCondition: (state) => {
          if (!state.scratchGui) return true;
          return state.scratchGui.mode.isPlayerOnly;
        },
      }
    );
    if (addon.self.disabled) {
      continue;
    }
    el.href = el.href.replace("https://scratch.mit.edu/discuss/youtube/", "https://www.youtube.com/watch?v=");
    changedLinks.push(el);
  }
}
