export default async function ({ addon, console, msg }) {
  let originalTextContent;

  // -- Make the links show/hide --

  function setupLinks() {
    if (addon.tab.editorMode === "projectpage") {
      setButton(addon.settings.get("type") === "new");
      setViewAllLink(addon.settings.get("type") === "replace");
    }
  }

  function hideAll() {
    if (addon.tab.editorMode === "projectpage") {
      setButton(false);
      setViewAllLink(false);
    }
  }

  // -- Functions for the links to use --

  function appendToProjectURL(appendage) {
    return `https://scratch.mit.edu/projects/${window.location.href.split("projects")[1].split("/")[1]}/${appendage}`;
  }

  function goToRemixTree(e) {
    if (addon.settings.get("new-tab") || e.ctrlKey || e.metaKey) {
      window.open(appendToProjectURL("remixtree"), "_blank", "noopener,noreferrer");
    } else {
      window.location.href = appendToProjectURL("remixtree");
    }
  }

  function setOpensInNewTab(newTab, element) {
    if (newTab) {
      element.target = "_blank";
      element.rel = "noopener noreferrer";
    } else {
      element.removeAttribute("target");
      element.removeAttribute("rel");
    }
  }

  // -- Code to show/hide links --

  async function setButton(enabled) {
    // Add a button next to "Copy Link"
    if (enabled) {
      if (document.querySelector("#scratchAddonsRemixTreeBtn")) {
        // If it's already there...
        document.querySelector("#scratchAddonsRemixTreeBtn").style.display = "block";
      } else {
        addon.tab
          .waitForElement(".flex-row.subactions", {
            reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
          })
          .then(() => {
            if (!document.querySelector(".copy-link-button")) return;
            if (document.querySelector("#scratchAddonsRemixTreeBtn")) return; // Check again because we're inside a promise
            const remixtree = document.createElement("button");

            const remixtreeSpan = document.createElement("span");
            remixtreeSpan.innerText = msg("remix-tree");
            remixtree.className = "button action-button remixtree-button";
            remixtree.id = "scratchAddonsRemixTreeBtn";
            remixtree.appendChild(remixtreeSpan);
            remixtree.addEventListener("click", (e) => {
              goToRemixTree(e);
            });
            addon.tab.appendToSharedSpace({ space: "afterCopyLinkButton", element: remixtree, order: 0 });
          });
      }
    } else {
      if (document.querySelector("#scratchAddonsRemixTreeBtn")) {
        document.querySelector("#scratchAddonsRemixTreeBtn").style.display = "none";
      }
    }
  }

  async function setViewAllLink(enabled) {
    // Change the "View all" link to .../remixes to link to .../remixtree
    if (enabled) {
      addon.tab.waitForElement(".remix-list").then(() => {
        const link = document.querySelector(".remix-list a");
        const linkSpan = document.querySelector(".remix-list a span");

        if (!originalTextContent) {
          originalTextContent = linkSpan.textContent; // Store what the button's text content was before the first time we change it (because different languages).
        }

        link.href = appendToProjectURL("remixtree");
        setOpensInNewTab(addon.settings.get("new-tab"), link);
        linkSpan.textContent = msg("remix-tree-link");
      });
    } else {
      addon.tab.waitForElement(".remix-list").then(() => {
        const link = document.querySelector(".remix-list a");
        if (link.href.split("/").includes("remixes")) return; // If we haven't changed it to link to the remix tree, don't do anything.
        const linkSpan = document.querySelector(".remix-list a span");

        link.href = appendToProjectURL("remixes");
        setOpensInNewTab(false, link);
        linkSpan.textContent = originalTextContent;
      });
    }
  }

  // -- Events --

  setupLinks();

  addon.tab.addEventListener("urlChange", () => {
    setupLinks();
  });

  addon.self.addEventListener("disabled", () => {
    hideAll();
  });

  addon.self.addEventListener("reenabled", () => {
    setupLinks();
  });

  addon.settings.addEventListener("change", () => {
    setupLinks();
  });
}
