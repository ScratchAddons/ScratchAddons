export default async function ({ addon, console }) {
  while (true) {
    await addon.tab.waitForElement('a[href^="https://scratch.mit.edu/discuss/youtube/"], a[href^="/discuss/youtube/"]');
    var elements = document.querySelectorAll(
      'a[href^="https://scratch.mit.edu/discuss/youtube/"], a[href^="/discuss/youtube/"]'
    );
    elements.forEach((element) => {
      element.href = element.href.replace(
        "https://scratch.mit.edu/discuss/youtube/",
        "https://www.youtube.com/watch?v="
      );
    });
  }
}
