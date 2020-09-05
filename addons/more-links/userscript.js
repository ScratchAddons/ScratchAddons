import "/libraries/linkify.min.js";
import "/libraries/linkify-element.min.js";

export default async function ({ addon }) {
  const pageType = document.location.pathname.substr(1).split("/")[0];
  let comments;

  switch (pageType) {
    case "users":
      linkifyElement(document.querySelectorAll("#user-details .read-only"));
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
