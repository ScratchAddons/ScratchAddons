export default async function ({ addon, global, console }) {
  addon.settings.addEventListener("change", () => console.log("changed!"));

  while (true) {
    await addon.tab.waitForElement(".comment-content:not(.commentsLineBreaksViewed),.comment .content:not(.commentsLineBreaksViewed)");
    var element = document.querySelector(".comment-content:not(.commentsLineBreaksViewed),.comment .content:not(.commentsLineBreaksViewed)");
    element.classList.add("commentsLineBreaksViewed");
    element.style="white-space:break-spaces;";
    element.textContent = element.textContent.slice(22, element.textContent.length-12);
  }
}