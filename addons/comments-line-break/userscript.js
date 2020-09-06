export default async function ({ addon, global, console }) {
  addon.settings.addEventListener("change", () => console.log("changed!"));

  while (true) {
    await addon.tab.waitForElement(
      ".comment-content:not(.commentsLineBreaksViewed),.comment .content:not(.commentsLineBreaksViewed)"
    );
    var element = document.querySelector(
      ".comment-content:not(.commentsLineBreaksViewed),.comment .content:not(.commentsLineBreaksViewed)"
    );
    element.style = "white-space:break-spaces;";

    if (document.querySelector(".comment .content:not(.commentsLineBreaksViewed)")) {
      /*element.textContent = element.textContent.slice(15, element.textContent.length);
      element.textContent = element.textContent.slice(0, element.textContent.indexOf('\n')) + 
                            element.textContent.slice(element.textContent.indexOf('\n') + 23, element.textContent.length);*/
    }

    var result = "\n";
    for (var i = 0; i < element.textContent.length; i++) {
      result += element.textContent[i].charCodeAt(0) + " ";
    }

    element.textContent += result;

    element.classList.add("commentsLineBreaksViewed");
  }
}
