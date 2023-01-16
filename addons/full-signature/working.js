export default async function ({ addon, console, msg }) {
  let activityStream = document.querySelectorAll(".activity-stream li");
  if (activityStream.length) {
    let container = document.querySelector(".activity-stream").appendChild(document.createElement("div"));
    container.classList.add("load-more-wibd-container");
    container.style.display = "none"; // overridden by userstyle if the setting is enabled
    let loadMore = container.appendChild(document.createElement("button"));
    loadMore.classList.add("load-more-wibd");
    loadMore.innerText = msg("load-more");
    let dataLoaded = 6;
    loadMore.addEventListener(
      "click",
      function () {
        loadMore.style.visibility = "hidden";
        fetch(`
        https://scratch.mit.edu/messages/ajax/user-activity/?user=${Scratch.INIT_DATA.PROFILE.model.id}&max=1000000`)
          .then((response) => response.text())
          .then((response) => {
            let html = new DOMParser().parseFromString(response, "text/html");
            const show = function () {
              let lastScroll = document.querySelector(".activity-stream").scrollTop;
              html.querySelectorAll("ul > li").forEach((li, index) => {
                if (index > dataLoaded && index < dataLoaded + 6) {
                  activityStream[activityStream.length - 1].append(li);
                }
              });
              dataLoaded += 6;
              document.querySelector(".activity-stream").scrollTop = lastScroll;
              if (dataLoaded >= html.querySelectorAll("ul > li").length) {
                loadMore.remove();
              }
            };
            show();
            loadMore.style.visibility = "visible";
            loadMore.addEventListener("click", show);
          });
      },
      { once: true }
    );
  }
}
