export default async function ({ addon, console, msg }) {
  // Functions (these are where the magic happens):
  function loadRemixButton() {
    if (document.querySelector("#scratchAddonsRemixTreeBtn") && addon.settings.get("type") === "new") {
      document.querySelector("#scratchAddonsRemixTreeBtn").style.display = "block";
      linkOpensInSameTab();
    } else {
      if (addon.tab.editorMode === "projectpage") {
        addon.tab
          .waitForElement(".flex-row.subactions", {
            reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
          })
          .then(() => {
            if (!document.querySelector(".copy-link-button")) return;
            if (addon.self.disabled) return;
            if (addon.settings.get("type") === "replace") {
              // Change the link from ".../remixes" to ".../remixtree".
              addon.tab.waitForElement(".remix-list").then(() => {
                document.querySelector(".remix-list a").href = window.location.href + "remixtree";
                if (addon.settings.get("new-tab")) {
                  linkOpensInNewTab();
                } else {
                  linkOpensInSameTab();
                }
                document.querySelector(".remix-list a span").textContent = msg("remix-tree-link");
              });
            } else {
              // Add a button next to "Copy Link".
              linkOpensInSameTab();
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
            }
          });
      }
    }
  }

  function goToRemixTree(e) {
    // Follow the link to the remix tree after clicking the button.
    if (addon.settings.get("open-with-icon") && !addon.self.disabled) {
      if (addon.settings.get("new-tab") || e.ctrlKey || e.metaKey) {
        window.open(
          `https://scratch.mit.edu/projects/${window.location.href.split("projects")[1].split("/")[1]}/remixtree`,
          "_blank",
          "noopener,noreferrer"
        );
      } else {
        window.location.href = `https://scratch.mit.edu/projects/${
          window.location.href.split("projects")[1].split("/")[1]
        }/remixtree`;
      }
    }
  }

  function undoLoadRemixButton() {
    // Removes the button.
    if (document.querySelector("#scratchAddonsRemixTreeBtn")) {
      document.querySelector("#scratchAddonsRemixTreeBtn").style.display = "none";
    }
  }

  function undoChangeLink() {
    // Changes the link back to /remixes.
    if (document.querySelector(".remix-list")) {
      document.querySelector(".remix-list a").href = window.location.href + "remixes";
      document.querySelector(".remix-list a span").textContent = "View all";
    }
  }

  function addIconLink() {
    // Turns the remixes icon on the project statistics row into a link to the remix tree.
    if (addon.settings.get("open-with-icon") && !addon.self.disabled) {
      if (addon.tab.editorMode === "projectpage") {
        addon.tab
          .waitForElement(".flex-row.subactions", {
            reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
          })
          .then(() => {
            const remixesIcon = document.querySelector(".project-remixes");
            remixesIcon.style.cursor = "pointer";
            remixesIcon.title = msg("go-to-remix-tree");
          });
      }
    }
  }

  function removeIconLink() {
    // Removes the link from the remixes statistic icon.
    if (addon.tab.editorMode === "projectpage") {
      const remixesIcon = document.querySelector(".project-remixes");
      remixesIcon.style.removeProperty("cursor");
      remixesIcon.removeAttribute("title");
    }
  }

  function linkOpensInNewTab() {
    document.querySelector(".remix-list a").target = "_blank";
    document.querySelector(".remix-list a").rel = "noopener noreferrer";
  }

  function linkOpensInSameTab() {
    if (addon.tab.editorMode === "projectpage") {
      document.querySelector(".remix-list a").removeAttribute("target");
      document.querySelector(".remix-list a").removeAttribute("rel");
    }
  }

  // Initialize:
  initialSetup();

  function initialSetup() {
    addon.tab
      .waitForElement(".flex-row.subactions", {
        reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
      })
      .then(() => {
        loadRemixButton();
        addIconLink();

        // This will make it possible to click the remixes icon to go to the remix tree,
        // but the function will only redirect if the appropriate setting is enabled.
        document.querySelector(".project-remixes").addEventListener("click", (e) => {
          goToRemixTree(e);
        });
      });
  }

  // Events:
  addon.tab.addEventListener("urlChange", () => {
    // When the user comes back to the project page from the editor, we need to re-add the links.
    loadRemixButton();
    addIconLink();
  });

  addon.self.addEventListener("disabled", () => {
    if (addon.settings.get("type") === "replace") {
      undoChangeLink();
    } else {
      undoLoadRemixButton();
    }
    if (addon.settings.get("open-with-icon")) {
      removeIconLink();
    }
  });
  addon.self.addEventListener("reenabled", () => {
    loadRemixButton();
    addIconLink();
  });
  addon.settings.addEventListener("change", () => {
    if (addon.settings.get("type") === "replace") {
      // Setting changed to replace - remove button and modify link
      undoLoadRemixButton();
      loadRemixButton();
    } else {
      // Setting changed to new - revert link and add button
      undoChangeLink();
      loadRemixButton();
    }
    if (addon.settings.get("open-with-icon")) {
      addIconLink();
    } else {
      removeIconLink();
    }
  });
}
