export default async function ({ addon, console }) {
  addon.self.addEventListener('disabled', e => {
    document.querySelectorAll(
      'a[href*="https://www.youtube.com/watch?v="]'
    ).forEach(element => {
      element.href = element.href.replace(
        "https://www.youtube.com/watch?v=",
        "/discuss/youtube/"
      );
    })
  })

  addon.self.addEventListener('reenabled', () => replaceYouTubeLinks())

  async function replaceYouTubeLinks() {
    await addon.tab.waitForElement(
      'a[href^="https://scratch.mit.edu/discuss/youtube/"], a[href^="/discuss/youtube/"]',
      {
        reduxCondition: (state) => {
          if (!state.scratchGui) return true;
          return state.scratchGui.mode.isPlayerOnly;
        },
      }
    );
    document.querySelectorAll(
      'a[href^="https://scratch.mit.edu/discuss/youtube/"], a[href^="/discuss/youtube/"]'
    ).forEach((element) => {
      element.href = element.href.replace(
        "https://scratch.mit.edu/discuss/youtube/",
        "https://www.youtube.com/watch?v="
      );
    });
  }

  replaceYouTubeLinks()
}
