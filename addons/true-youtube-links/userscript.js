export default async function ({ addon, global, console }) {
  addon.settings.addEventListener("change", () => console.log("changed!"));
  while (true) {
    await addon.tab.waitForElement("a:not(.trueYTLinksViewed)");
    var element = document.querySelector("a:not(.trueYTLinksViewed)");
    if (element.href.indexOf("https://scratch.mit.edu/discuss/youtube/") == 0) {
      element.href = element.href.replace("https://scratch.mit.edu/discuss/youtube/", "https://youtu.be/");
    }
    element.classList.add("trueYTLinksViewed");
  }
}
