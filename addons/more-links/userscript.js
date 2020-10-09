export default async function ({ addon, console }) {
  console.log("load");
  await addon.tab.loadScript("https://cdn.jsdelivr.net/npm/linkifyjs@2.1.9/dist/linkify.min.js");
  await addon.tab.loadScript("https://cdn.jsdelivr.net/npm/linkifyjs@2.1.9/dist/linkify-element.min.js");

  const pageType = document.location.pathname.substr(1).split("/")[0];
  console.log(pageType);

  switch (pageType) {
    case "users":
      document.querySelectorAll("#user-details .read-only").forEach((element) => linkifyElement(element));
      break;

    case "projects":
      (async () => {
        while (true) {
          console.log("wait projects");
          await addon.tab.waitForElement(".project-description:not(.more-links-checked)");
          console.log("go projects");
          let element = document.querySelector(".project-description"); // How is this laggy?
          // Need to convert #[numbers] to solve conflict between tags and external Scratch player links.
          document.querySelectorAll(".project-description a").forEach((element) => {
            if (/\d+/.test(element.textContent)) element.outerHTML = element.textContent;
          });
          linkifyElement(element);
          console.log("linkified", element);
          element.classList.add("more-links-checked");
        }
      })();
      break;

    case "studios":
      linkifyElement(document.querySelector("#description.read-only .overview"));
      break;
  }

  console.log("comments?");

  (async () => {
    while (true) {
      console.log("wait comments");
      await addon.tab.waitForElement(".comment:not(.more-links-checked)");
      console.log("go comments");
      let comments = document.querySelectorAll(".comment:not(.more-links-checked)");
      comments.forEach((comment) => {
        linkifyElement(comment);
        console.log("linkified", comment);
        comment.classList.add("more-links-checked");
      });
    }
  })();
}
