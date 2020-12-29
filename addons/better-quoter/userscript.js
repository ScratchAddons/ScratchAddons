export default async function ({ addon, global, console }) {
  let textarea = document.querySelector(".markItUpEditor");
  while (true) {
    let quoteButton = await addon.tab.waitForElement(".postquote a", { markAsSeen: true });
    quoteButton.setAttribute("onclick", "return false");
    quoteButton.addEventListener("mouseup", (e) => {
      let blockpost = e.path.find((e) => e.classList.contains("blockpost"));
      if (window.getSelection().toString().length)
        textarea.value += `[quote=${
          blockpost.querySelector(".black.username").innerText
        }]${window.getSelection().toString()}[/quote]`;
      else copy_paste(blockpost.id);
    });
  }
}
