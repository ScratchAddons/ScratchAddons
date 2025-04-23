export default async function ({ addon, console, msg }) {
  document.addEventListener("keydown", (event) => {
    if (event.key == addon.settings.get("show-trash-shortcut") && ! document.activeElement.matches(':focus')) {
      document.body.classList.add("sa-show-trash");
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key == addon.settings.get("show-trash-shortcut")) {
      document.body.classList.remove("sa-show-trash");
    }
  });

  window.addEventListener("blur", () => {
    document.body.classList.remove("sa-show-trash");
  })
}
