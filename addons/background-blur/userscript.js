export default async function ({ addon, console }) {
  const overlay = document.createElement("div");
  overlay.classList.add("sa-blur-overlay");
  document.body.insertBefore(overlay, document.body.firstChild);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      const existingOverlay = document.querySelector(".ReactModal__Content");

      const modalOverlayExists = document.querySelector(".ReactModal__Overlay");
      overlay.classList.toggle("blur", modalOverlayExists);
      existingOverlay?.classList.toggle("visible", modalOverlayExists);
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
