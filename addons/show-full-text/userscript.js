export default async function ({ addon, console }) {
  const MODE_ADD = 1;
  const MODE_REMOVE = 2;

  function addTitle(textItem, mode) {
    if (textItem) {
      if (mode == 1) {
        textItem.setAttribute("title", textItem.innerHTML);
      } else if (mode == 2) {
        if (textItem.hasAttribute("title")) {
          textItem.removeAttribute("title");
        }
      }
    }
  }

  function setTitlesInProfile(mode) {
    // Select overflowed items on profiles
    const profileItems = document.querySelectorAll("li.project.thumb.item, li.gallery.thumb.item, li.user.thumb.item");
    // Add title attribute to all
    profileItems.forEach((i) => {
      addTitle(i.querySelector("span.title").querySelector("a"), mode);
    });
  }

  function setTitlesInStudio(mode) {
    // Select overflowed items on studios
    const studioItems = document.querySelectorAll(
      "a.studio-project-title, a.studio-project-username, a.studio-member-name"
    );
    // Add title attribute to all
    studioItems.forEach((i) => {
      addTitle(i, mode);
    });
  }

  // Add titles when page loads
  setTitlesInProfile(MODE_ADD);
  setTitlesInStudio(MODE_ADD);

  // When document is changed
  function domChanged(mutations, observer) {
    mutations.forEach((i) => {
      i.addedNodes.forEach((node) => {
        // If added node is an element
        if (node.nodeType == 1) {
          if (addon.self.disabled) {
            setTitlesInProfile(MODE_REMOVE);
            setTitlesInStudio(MODE_REMOVE);
          } else {
            setTitlesInProfile(MODE_ADD);
            setTitlesInStudio(MODE_ADD);
          }
        }
      });
    });
  }

  // Set up observer
  const observer = new MutationObserver(domChanged);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Remove all title attributes on disable
  addon.self.addEventListener("disabled", () => {
    setTitlesInProfile(MODE_REMOVE);
    setTitlesInStudio(MODE_REMOVE);
  });

  addon.self.addEventListener("reenabled", () => {
    setTitlesInProfile(MODE_ADD);
    setTitlesInStudio(MODE_ADD);
  });
}
