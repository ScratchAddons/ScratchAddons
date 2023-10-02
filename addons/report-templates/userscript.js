export default async function ({ msg, console }) {
  if (location.pathname !== "/discuss/misc/") {
    return;
  }

  const TEMPLATES = [
    {
      name: msg("duplicate"),
      text: "This post is a duplicate of [...]. Could you close it?",
    },
    {
      name: msg("guide"),
      text: "This post is a guide, which are not allowed in the forums currently. Could you close it?",
    },
    {
      name: msg("spam"),
      text: "This post seems to be spam and serves no actual purpose. Could you close/dustbin it?",
    },
    {
      name: msg("personal-information"),
      text: "This post shows some personal information about the user. Could you remove it? It can be found in [...].",
    },
  ];

  const reason = document.querySelector("#id_reason");

  const templatesEl = document.createElement("p");
  templatesEl.classList.add("form-help");
  templatesEl.appendChild(document.createTextNode(msg("templates") + " "));

  TEMPLATES.forEach(({ name, text }, index) => {
    const cursorPosition = text.indexOf("[...]");
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = name;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (reason.value !== "" && !confirm(msg("delete-reason"))) {
        return;
      }
      reason.focus();
      reason.value = text;
      if (cursorPosition !== -1) {
        reason.setSelectionRange(cursorPosition, cursorPosition + 5);
      }
    });
    templatesEl.appendChild(link);
    if (index !== TEMPLATES.length - 1) {
      templatesEl.appendChild(document.createTextNode(" | "));
    }
  });

  document.querySelector(".form-help").insertAdjacentElement("afterend", templatesEl);
}
