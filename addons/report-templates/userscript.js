export default async function ({ addon, msg, console }) {
  if (location.pathname !== "/discuss/misc/") {
    return;
  }

  const reason = document.querySelector("#id_reason");

  const templatesEl = document.createElement("p");
  templatesEl.classList.add("form-help");
  templatesEl.appendChild(document.createTextNode(msg("templates") + " "));

  const templates = addon.settings.get("templates");
  templates.forEach(({ name, text }, index) => {
    const cursorPosition = text.indexOf("|");
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = name;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (reason.value !== "" && !confirm(msg("delete-reason"))) {
        return;
      }
      reason.value = text.replaceAll("|", "");
      reason.focus();
      reason.setSelectionRange(cursorPosition, cursorPosition);
    });
    templatesEl.appendChild(link);
    if (index !== templates.length - 1) {
      templatesEl.appendChild(document.createTextNode(" | "));
    }
  });

  document.querySelector(".form-help").insertAdjacentElement("afterend", templatesEl);
}
