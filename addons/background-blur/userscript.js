export default async function ({ addon, console }) {
  const overlay = document.createElement("div");
  overlay.classList.add("sa-blur-overlay");
  document.body.insertBefore(overlay, document.body.firstChild);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const modalOverlayExists = document.querySelector(".ReactModal__Overlay");
      overlay.classList.toggle("blur", modalOverlayExists);
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
