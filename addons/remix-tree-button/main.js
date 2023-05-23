export default async function ({ addon, console, msg }) {
  //define remix tree button elements
  function loadRemixButton() {
    if (document.querySelector("#scratchAddonsRemixTreeBtn") && addon.settings.get("type") === "new") {
      document.querySelector("#scratchAddonsRemixTreeBtn").style.display = "block";
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
              // Change the link from ".../remixes" to ".../remixtree"
              addon.tab.waitForElement(".remix-list").then(() => {
                document.querySelector(".remix-list a").href = window.location.href + "remixtree";
                document.querySelector(".remix-list a span").textContent = "Remix tree";
              });
            } else {
              // Add a button next to "Copy Link"
              if (document.querySelector("#scratchAddonsRemixTreeBtn")) return; // Check again because we're inside a promise
              const remixtree = document.createElement("button");
              const remixtreeSpan = document.createElement("span");
              remixtreeSpan.innerText = msg("remix-tree");
              remixtree.className = "button action-button remixtree-button";
              remixtree.id = "scratchAddonsRemixTreeBtn";
              remixtree.appendChild(remixtreeSpan);
              remixtree.addEventListener("click", () => {
                window.location.href = `https://scratch.mit.edu/projects/${
                  window.location.href.split("projects")[1].split("/")[1]
                }/remixtree`;
              });
              addon.tab.appendToSharedSpace({ space: "afterCopyLinkButton", element: remixtree, order: 0 });
            }
          });
      }
    }
  }

  function undoLoadRemixButton() {
    if (document.querySelector("#scratchAddonsRemixTreeBtn")) {
      document.querySelector("#scratchAddonsRemixTreeBtn").style.display = "none";
    }
  }

  function undoChangeLink() {
    if (document.querySelector(".remix-list")) {
      document.querySelector(".remix-list a").href = window.location.href + "remixes";
      document.querySelector(".remix-list a span").textContent = "View all";
    }
  }

  loadRemixButton();
  addon.tab.addEventListener("urlChange", () => {
    loadRemixButton();
  });

  addon.self.addEventListener("disabled", () => {
    if (addon.settings.get("type") === "replace") {
      undoChangeLink();
    } else {
      undoLoadRemixButton();
    }
  });
  addon.self.addEventListener("reenabled", () => {
    loadRemixButton();
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
  });
}
