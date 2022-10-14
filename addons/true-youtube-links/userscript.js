export default async function ({ addon, console }) {
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
    el.href = el.href.replace("https://scratch.mit.edu/discuss/youtube/", "https://www.youtube.com/watch?v=");
  }
}
