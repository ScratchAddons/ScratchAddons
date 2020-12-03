export default async ({ addon, msg, safeMsg }) => {
  const postElem = await addon.tab.waitForElement("form#post > label:last-of-type");
  let errorlist = postElem.querySelector(".errorlist");
  if (!errorlist) {
    errorlist = document.createElement("ul");
    errorlist.classList.add("errorlist");
    postElem.insertBefore(errorlist, postElem.children[1]);
  }
  const reportLink = document.createElement("a");
  reportLink.href = "https://scratchaddons.com/feedback";
  reportLink.target = "_blank";
  reportLink.textContent = msg("report-here");
  const warning = document.createElement("li");
  warning.classList.add("sa-forum-warning");
  warning.innerHTML = safeMsg("warning", {
    reportLink: reportLink.outerHTML
  });
  errorlist.appendChild(warning);
  
  if (addon.settings.get("blockPosts")) {
    const textarea = document.querySelector("textarea#id_body");
    textarea.addEventListener("input", () => {
      if (/scratch[ -]?(?:addons|messaging[ -]extension)/ig.test(textarea.value)) {
        textarea.setCustomValidity(msg("post-blocked"));
      } else {
        textarea.setCustomValidity("");
      }
    })
  }
};