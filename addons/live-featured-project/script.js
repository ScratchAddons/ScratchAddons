export default async function ({ addon }) {
  const showMenu = addon.settings.get("showMenu");
  const forceAlternative = addon.settings.get("forceAlternative");
  const alternativePlayer = addon.settings.get("alternativePlayer");
  const autoPlay = addon.settings.get("autoPlay");

  const stageElement = document.querySelector(".stage");
  const projectId = window.Scratch.INIT_DATA.PROFILE.featuredProject.id;

  // Create and append elements

  const iframeElement = document.createElement("iframe");
  iframeElement.setAttribute("allowtransparency", "");
  iframeElement.setAttribute("width", "282");
  iframeElement.setAttribute("height", "210");
  iframeElement.setAttribute("frameborder", "0");
  iframeElement.setAttribute("allowfullscreen", "");

  const wrapperElement = document.createElement("div");
  wrapperElement.id = "lfp-embed";

  const changeFeaturedElement = document.createElement("div");
  changeFeaturedElement.id = "lfp-change-featured";
  changeFeaturedElement.textContent = "Change featured project";
  changeFeaturedElement.addEventListener("click", () => {
    document.querySelector('#profile-box .player [data-control="edit"]').click();
  });

  wrapperElement.appendChild(iframeElement);
  if (document.querySelector('#profile-box .player [data-control="edit"]'))
    wrapperElement.appendChild(changeFeaturedElement);
  stageElement.appendChild(wrapperElement);

  // Functions for loading embeds

  const loadScratch = () => {
    wrapperElement.className = "lfp-scratch";

    if (showMenu) {
      wrapperElement.classList.add("lfp-show-menu");
    } else {
      iframeElement.setAttribute("height", "260");
      wrapperElement.classList.add("lfp-hide-menu");
    }

    iframeElement.setAttribute("src", `https://scratch.mit.edu/projects/embed/${projectId}/?autostart=true`);

    // Auto-start Scratch players (sadly need to be done automatically)

    if (autoPlay)
      iframeElement.addEventListener(
        "load",
        function callback() {
          const observer = new MutationObserver(() => {
            if (iframeElement.contentDocument.querySelector(".loader_fullscreen_29EhP") === null) {
              iframeElement.contentDocument.querySelector(".green-flag_green-flag_1kiAo").click();
              observer.disconnect();
            }
          });
          observer.observe(iframeElement.contentDocument.body, {
            childList: true,
            subtree: true,
          });
        },
        { once: true }
      );
  };

  const loadTurboWarp = () => {
    iframeElement.setAttribute("src", `https://turbowarp.org/embed.html${autoPlay ? "?autoplay" : ""}#${projectId}`);
    wrapperElement.className = "lfp-turbowarp";

    if (showMenu) {
      wrapperElement.classList.add("lfp-show-menu");
    } else {
      iframeElement.setAttribute("height", "260");
      wrapperElement.classList.add("lfp-hide-menu");
    }
  };

  const loadForkphorus = () => {
    wrapperElement.className = "lfp-forkphorus";
    iframeElement.setAttribute(
      "src",
      `https://forkphorus.github.io/embed.html?id=${projectId}&auto-start=${autoPlay}&ui=${showMenu}`
    );
    if (!autoPlay) frameElement.setAttribute("width", "239");
  };

  // Start loading the players

  stageElement.classList.add("lfp-loaded");

  if (forceAlternative) {
    if (alternativePlayer === "TurboWarp") loadTurboWarp();
    else loadForkphorus();
  } else {
    loadScratch();
    iframeElement.addEventListener("load", () => {
      if (iframeElement.contentDocument.querySelector(".not-available-outer") !== null) {
        if (alternativePlayer === "TurboWarp") loadTurboWarp();
        else loadForkphorus();
      }
    });
  }
}
