export default async function ({ addon, console, msg }) {
  function createBetterProfilePage(featuredThumb, featuredLink, featuredHeading, featuredTitle) {
    const dateText = document.createElement("span");
    dateText.textContent = `(${document.querySelector(".profile-details span:nth-child(2)").title})`;
    document.querySelector(".profile-details .location").insertAdjacentElement("beforebegin", dateText);
    addon.tab.displayNoneWhileDisabled(dateText);

    document.documentElement.style.setProperty("--featured-thumb", `url("${featuredThumb}")`);
    let boxHead = document.querySelector("#profile-data .box-head");
    let headerText = boxHead.querySelector(".header-text");
    if (featuredLink === "") return;
    if (true) {
      if (document.querySelector(".user-content .player .title a").innerText.replace(/\s/g, "").length > 0) {
        headerText.insertAdjacentElement("afterend", document.createElement("div")).id = "fpb-name";
        document.getElementById("fpb-name").append(document.createElement("h2"), document.createElement("h3"));
        document.querySelector("#fpb-name h2").innerText = featuredHeading;
        document.querySelector("#fpb-name h3").innerText = featuredTitle;
      }
      if (document.querySelector('#featured-project [data-control]')) {
        document
          .getElementById("fpb-name")
          .insertAdjacentElement("afterend", document.createElement("div"))
          .className = "buttons";
        document
          .querySelector("#profile-data .box-head .buttons")
          .appendChild(document.createElement("button"))
          .id = "fpb-change";
        document.getElementById("fpb-change").innerText = document.querySelector(
          '#featured-project [data-control]'
        ).innerText;
        document.getElementById("fpb-change").addEventListener("click", function () {
          document.querySelector('#featured-project [data-control]').click();
          let checkFeaturedProjectModalTimes = 0;
          var checkFeaturedProjectModal = setInterval(function () {
            checkFeaturedProjectModalTimes++;
            if (document.getElementById("featured-project-modal")) {
              clearInterval(checkFeaturedProjectModal);
              document
                .querySelector("#featured-project-modal .btn.blue.btn-primary")
                .addEventListener("click", function () {
                  let checkFeaturedProjectTimes = 0;
                  const oldFeaturedProjectURL = document.getElementById("featured-project").href;
                  const checkFeaturedProject = setInterval(function () {
                    checkFeaturedProjectTimes++;
                    if (checkFeaturedProjectTimes > 1000) {
                      clearInterval(checkFeaturedProject);
                    }
                    if (oldFeaturedProjectURL !== document.getElementById("featured-project").href) {
                      clearInterval(checkFeaturedProject);
                      document.documentElement.style.setProperty("--featured-thumb", `url("")`);
                      location.reload();
                    }
                  }, 10);
                });
            } else if (checkFeaturedProjectModalTimes > 1000) {
              clearInterval(checkFeaturedProjectModal);
            }
          }, 10);
        });
      }
      boxHead.insertAdjacentElement("afterbegin", document.createElement("a")).id = "fpb-overlay";
      document.getElementById("fpb-overlay").href = featuredLink;
    }
    addon.tab.displayNoneWhileDisabled(document.getElementById("fpb-name"));
    addon.tab.displayNoneWhileDisabled(document.getElementById("fpb-overlay"));
    addon.tab.displayNoneWhileDisabled(document.getElementById("fpb-change"));
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
