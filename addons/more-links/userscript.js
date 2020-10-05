export default async function ({ addon }) {
  await addon.tab.loadScript("https://cdn.jsdelivr.net/npm/linkifyjs@2.1.9/dist/linkify.min.js");
  await addon.tab.loadScript("https://cdn.jsdelivr.net/npm/linkifyjs@2.1.9/dist/linkify-element.min.js");

  const pageType = document.location.pathname.substr(1).split("/")[0];
  let comments;

  switch (pageType) {
    case "users":
      document.querySelectorAll("#user-details .read-only").forEach((element) => linkifyElement(element));
      break;
    case "projects":
      // Need to convert #[numbers] to solve conflict between tags and external Scratch player links.
      document.querySelectorAll(".project-description a").forEach((element) => {
        if (/\d+/.test(element.textContent)) element.outerHTML = element.textContent;
      });
      linkifyElement(document.querySelector(".project-description"));
      break;
    case "studios":
      linkifyElement(document.querySelector("#description.read-only .overview"));
      break;
  }

  while (true) {
    await addon.tab.waitForElement(".comment:not(.more-links-checked)");
    comments = document.querySelectorAll(".comment:not(.more-links-checked)");
    comments.forEach((comment) => {
      linkifyElement(comment);
      comment.classList.add("more-links-checked");
    });
  }
}
