<<<<<<< HEAD
export default async function ({ addon }) {
=======
export default async function ({ addon, msg }) {
>>>>>>> b75a7312d02ba4231aa4e29bc3979ed509932170
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
<<<<<<< HEAD
  changeFeaturedElement.textContent = "Change featured project";
=======
  changeFeaturedElement.textContent = msg("change-featured");
>>>>>>> b75a7312d02ba4231aa4e29bc3979ed509932170
  changeFeaturedElement.addEventListener("click", () => {
    document.querySelector('#profile-box .player [data-control="edit"]').click();
  });

  wrapperElement.appendChild(iframeElement);
  if (document.querySelector('#profile-box .player [data-control="edit"]'))
    wrapperElement.appendChild(changeFeaturedElement);
<<<<<<< HEAD
  stageElement.appendChild(wrapperElement);
=======
  stageElement.prepend(wrapperElement);

  if (showMenu) wrapperElement.classList.add("lfp-show-menu");
  else wrapperElement.classList.add("lfp-hide-menu");
>>>>>>> b75a7312d02ba4231aa4e29bc3979ed509932170

  // Functions for loading embeds

  const loadScratch = () => {
<<<<<<< HEAD
    wrapperElement.className = "lfp-scratch";

    if (showMenu) {
      wrapperElement.classList.add("lfp-show-menu");
    } else {
      iframeElement.setAttribute("height", "260");
      wrapperElement.classList.add("lfp-hide-menu");
    }

=======
    wrapperElement.dataset.player = "scratch";
    if (!showMenu) iframeElement.setAttribute("height", "260");
>>>>>>> b75a7312d02ba4231aa4e29bc3979ed509932170
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
<<<<<<< HEAD
        { once: true }
=======
        {
          once: true,
        }
>>>>>>> b75a7312d02ba4231aa4e29bc3979ed509932170
      );
  };

  const loadTurboWarp = () => {
    iframeElement.setAttribute("src", `https://turbowarp.org/embed.html${autoPlay ? "?autoplay" : ""}#${projectId}`);
<<<<<<< HEAD
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
=======
    wrapperElement.dataset.player = "turbowarp";
    if (!showMenu) iframeElement.setAttribute("height", "260");
  };

  const loadForkphorus = () => {
    wrapperElement.dataset.player = "forkphorus";
>>>>>>> b75a7312d02ba4231aa4e29bc3979ed509932170
    iframeElement.setAttribute(
      "src",
      `https://forkphorus.github.io/embed.html?id=${projectId}&auto-start=${autoPlay}&ui=${showMenu}`
    );
<<<<<<< HEAD
    if (!autoPlay) frameElement.setAttribute("width", "239");
=======
>>>>>>> b75a7312d02ba4231aa4e29bc3979ed509932170
  };

  // Start loading the players

<<<<<<< HEAD
  stageElement.classList.add("lfp-loaded");

  if (forceAlternative) {
    if (alternativePlayer === "TurboWarp") loadTurboWarp();
    else loadForkphorus();
=======
  if (forceAlternative && alternativePlayer !== "none") {
    if (alternativePlayer === "turbowarp") loadTurboWarp();
    else if (alternativePlayer === "forkphorus") loadForkphorus();
>>>>>>> b75a7312d02ba4231aa4e29bc3979ed509932170
  } else {
    loadScratch();
    iframeElement.addEventListener("load", () => {
      if (iframeElement.contentDocument.querySelector(".not-available-outer") !== null) {
<<<<<<< HEAD
        if (alternativePlayer === "TurboWarp") loadTurboWarp();
        else loadForkphorus();
=======
        if (alternativePlayer === "turbowarp") loadTurboWarp();
        else if (alternativePlayer === "forkphorus") loadForkphorus();
        else stageElement.removeChild(wrapperElement);
>>>>>>> b75a7312d02ba4231aa4e29bc3979ed509932170
      }
    });
  }
}
