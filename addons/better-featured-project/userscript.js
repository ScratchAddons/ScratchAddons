export default async function ({ addon, console, msg }) {
  function createBetterProfilePage(featuredThumb, featuredLink, featuredHeading, featuredTitle) {
    document.documentElement.style.setProperty("--featured-thumb", `url("${featuredThumb}")`);

    const dateText = document.createElement("span");
    dateText.textContent = `(${document.querySelector(".profile-details span:nth-child(2)").title})`;
    document.querySelector(".profile-details .location").insertAdjacentElement("beforebegin", dateText);
    addon.tab.displayNoneWhileDisabled(dateText);

    if (featuredLink === "") return; // If no featured project is set, stop here

    let boxHead = document.querySelector("#profile-data .box-head");
    let headerText = boxHead.querySelector(".header-text");
    if (document.querySelector(".user-content .player .title a").innerText.trim().length) {
      var featuredProjectName = document.createElement("div");
      featuredProjectName.id = "better-featured-project-name";

      const [h2, h3] = [document.createElement("h2"), document.createElement("h3")];
      h2.innerText = featuredHeading;
      h3.innerText = featuredTitle;
      featuredProjectName.append(h2, h3);

      headerText.insertAdjacentElement("afterend", featuredProjectName);
      addon.tab.displayNoneWhileDisabled(featuredProjectName);
    }

    boxHead.insertAdjacentElement("afterbegin", document.createElement("a")).id = "better-featured-project-overlay";
    document.getElementById("better-featured-project-overlay").href = featuredLink;
    addon.tab.displayNoneWhileDisabled(document.getElementById("better-featured-project-overlay"));

    // "Change featured project" button
    const realChangeButton = document.querySelector("#featured-project [data-control='edit']");
    if (realChangeButton) {
      featuredProjectName.insertAdjacentElement("afterend", document.createElement("div")).className = "buttons";
      boxHead.querySelector(".buttons").appendChild(document.createElement("button")).id =
        "better-change-featured-project";
      document.getElementById("better-change-featured-project").innerText = realChangeButton.innerText;
      document.getElementById("better-change-featured-project").addEventListener("click", async function () {
        realChangeButton.click();

        const submitButton = await addon.tab.waitForElement("#featured-project-modal .btn.blue.btn-primary");
        submitButton.addEventListener("click", function () {
          // Featured project changed, reload page after it updates
          let checkFeaturedProjectTimes = 0;
          const oldFeaturedProjectURL = document.getElementById("featured-project").href;
          const checkFeaturedProject = setInterval(function () {
            checkFeaturedProjectTimes++;
            if (checkFeaturedProjectTimes > 200) {
              clearInterval(checkFeaturedProject);
            }
            if (oldFeaturedProjectURL !== document.getElementById("featured-project").href) {
              clearInterval(checkFeaturedProject);
              document.documentElement.style.setProperty("--featured-thumb", `url("")`);
              location.reload();
            }
          }, 50);
        });
      });
      addon.tab.displayNoneWhileDisabled(document.getElementById("better-change-featured-project"));
    }
  }

  // By the time this element has loaded, the featured project will be there too
  await addon.tab.waitForElement("#profile-box-footer");

  if (document.querySelector(".user-content .stage")) {
    createBetterProfilePage(
      document.querySelector(".user-content .stage img").src.replace(/\d+x\d+/, "480x360"),
      document.querySelector(".user-content .stage a").href,
      document.querySelector(".featured-project-heading").innerText,
      document.querySelector(".user-content .player .title a").innerText
    );
  } else if (document.querySelector("#profile-avatar img")) {
    createBetterProfilePage(document.querySelector("#profile-avatar img").src, "", "", "");
  }
}
