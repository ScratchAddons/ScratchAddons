import "/libraries/linkify.min.js";
import "/libraries/linkify-element.min.js";

export default async function () {
  switch (document.location.pathname.substr(1).split("/")[0]) {
    case "users":
      linkifyElement(document.querySelector("#user-details"));
      break;
    case "projects":
      // Need to convert #[numbers] to solve conflict between tags and external Scratch player links.
      document.querySelectorAll(".project-description a").forEach(element => { 
        if (/\d+/.test(element.innerHTML)) element.outerHTML = element.innerHTML
      })
      linkifyElement(document.querySelector(".project-notes"));
      break;
    case "studios":
      linkifyElement(document.querySelector(".overview"));
      break;
  }
}
