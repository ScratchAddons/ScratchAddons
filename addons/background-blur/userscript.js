export default async function ({ addon, console }) {
  const overlay = document.createElement("div");
  overlay.classList.add("sa-blur-overlay");
  document.body.insertBefore(overlay, document.body.firstChild);

  while (true) {
    await addon.tab.waitForElement(".ReactModal__Overlay", { markAsSeen: true });
    overlay.classList.add("blur");

    const intervalId = setInterval(() => {
      if (!document.querySelector(".ReactModal__Overlay")) {
        overlay.classList.remove("blur");
        clearInterval(intervalId);
      }
    }, 100);
  }
}
