export default async function ({ msg, console }) {
  if (location.pathname !== "/discuss/misc/") {
    return;
  }

  const TEMPLATES = [
    {
      name: msg("duplicate"),
      text: `This post is a duplicate of ${msg("c-topic")}. Could you close it?`,
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
      name: msg("rejected"),
      text: `This suggestion is rejected (${msg("c-reject-number")}). Could you close it?`,
    },
    {
      name: msg("resolved"),
      text: `This topic is now resolved, as ${msg("c-close-reason")}. Could you close it?`,
    },
    {
      name: msg("personal-information"),
      text: `This post shows some personal information about the user. Could you remove it? It can be found in ${msg(
        "c-personal-information"
      )}.`,
    },
    {
      name: msg("browser-extension"),
      text: `This post mentions the browser extension "${msg("c-browser-extension")}". Could you remove it?`,
    },
    {
      name: msg("move"),
      text: `This topic seems to be in the wrong category. Could you please move it to ${msg("c-new-category")}?`,
    },
    {
      name: msg("reopen"),
      text: "I've accidentally closed this topic. Could you reopen it?",
    },
  ];

  const reason = document.querySelector("#id_reason");

  const templatesEl = document.createElement("p");
  templatesEl.classList.add("sa-report-templates");
  const templatesHeading = document.createElement("span");
  templatesHeading.textContent = "Templates:";
  templatesHeading.classList.add("sa-report-templates-heading");
  templatesEl.appendChild(templatesHeading);

  TEMPLATES.forEach(({ name, text }, index) => {
    const cursorMatch = text.match(/\[.*?\]/);
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
      if (cursorMatch !== null) {
        console.log(cursorMatch);
        reason.setSelectionRange(cursorMatch.index, cursorMatch.index + cursorMatch[0].length);
      }
    });
    templatesEl.appendChild(link);
    if (index !== TEMPLATES.length - 1) {
      templatesEl.appendChild(document.createTextNode(" | "));
    }
  });

  const setWidth = () => {
    templatesEl.style.maxWidth = reason.getBoundingClientRect().width + "px";
  };
  setWidth();
  new ResizeObserver(setWidth).observe(reason);

  reason.insertAdjacentElement("afterend", templatesEl);
}
