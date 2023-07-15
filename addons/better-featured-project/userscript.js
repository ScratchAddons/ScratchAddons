export default async function ({ addon, console, msg }) {
  function createBetterProfilePage(featuredThumb, featuredLink, featuredHeading, featuredTitle) {
    document.documentElement.style.setProperty("--featured-thumb", `url("${featuredThumb}")`);
    let boxHead = document.querySelector("#profile-data .box-head");
    if (featuredLink !== "") {
      if (document.querySelector(".user-content .player .title a").innerText.replace(/\s/g, "").length > 0) {
        boxHead.appendChild(document.createElement("div")).setAttribute("id", "better-featured-project-name");
        document.querySelector("#better-featured-project-name").appendChild(document.createElement("h2"));
        document.querySelector("#better-featured-project-name").appendChild(document.createElement("h3"));
        document.querySelector("#better-featured-project-name h2").innerText = featuredHeading;
        document.querySelector("#better-featured-project-name h3").innerText = featuredTitle;
      }
      if (document.querySelector('#featured-project [data-control="edit"]') !== null) {
        boxHead.appendChild(document.createElement("div")).setAttribute("class", "buttons");
        document
          .querySelector("#profile-data .box-head .buttons")
          .appendChild(document.createElement("button"))
          .setAttribute("id", "better-change-featured-project");
        document.querySelector("#better-change-featured-project").innerText = document.querySelector(
          '#featured-project [data-control="edit"]',
        ).innerText;
        document.querySelector("#better-change-featured-project").addEventListener("click", function () {
          document.querySelector('#featured-project [data-control="edit"]').click();
          let checkFeaturedProjectModalTimes = 0;
          var checkFeaturedProjectModal = setInterval(function () {
            checkFeaturedProjectModalTimes++;
            if (document.querySelector("#featured-project-modal") !== null) {
              clearInterval(checkFeaturedProjectModal);
              document
                .querySelector("#featured-project-modal .btn.blue.btn-primary")
                .addEventListener("click", function () {
                  let checkFeaturedProjectTimes = 0;
                  let checkFeaturedProjectLink = document.querySelector("#featured-project").href;
                  var checkFeaturedProject = setInterval(function () {
                    checkFeaturedProjectTimes++;
                    if (checkFeaturedProjectTimes > 1000) {
                      clearInterval(checkFeaturedProject);
                    }
                    if (checkFeaturedProjectLink !== document.querySelector("#featured-project").href) {
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
      boxHead
        .insertAdjacentElement("afterbegin", document.createElement("a"))
        .setAttribute("id", "better-featured-project-overlay");
      document.querySelector("#better-featured-project-overlay").href = featuredLink;
    }
    document
      .querySelector(".profile-details .location")
      .insertAdjacentText("beforebegin", `(${document.querySelector(".profile-details span:nth-child(2)").title})`);
  }
  if (document.querySelector(".user-content .stage") !== null) {
    createBetterProfilePage(
      document.querySelector(".user-content .stage img").src.replace(/[0-9]+x[0-9]+/, "480x360"),
      document.querySelector(".user-content .stage a").href,
      document.querySelector(".featured-project-heading").innerText,
      document.querySelector(".user-content .player .title a").innerText,
    );
  } else if (document.querySelector("#profile-avatar img") !== null) {
    createBetterProfilePage(document.querySelector("#profile-avatar img").src, "", "", "");
  }
}
