export default async function ({ addon, global, console }) {
  addon.settings.addEventListener("change", () => console.log("changed!"));

  while (true) {
    await addon.tab.waitForElement(
      ".comment-content:not(.markdownForCommentsViewed),.comment .content:not(.markdownForCommentsViewed)"
    );
    var element = document.querySelector(
      ".comment-content:not(.markdownForCommentsViewed),.comment .content:not(.markdownForCommentsViewed)"
    );
    element.classList.add("markdownForCommentsViewed");
    element.style = "white-space:break-spaces;";

    element.textContent = element.textContent.slice(22, element.textContent.length - 12);
  }
}
