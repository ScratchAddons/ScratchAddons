export default async function ({ addon, global, console }) {
  let activityStream = document.querySelectorAll(".activity-stream li");
  let container = document.querySelector(".activity-stream").appendChild(document.createElement("div"));
  container.classList.add("load-more-wibd-container");
  let loadMore = container.appendChild(document.createElement("button"));
  loadMore.classList.add("load-more-wibd");
  loadMore.innerText = "Load More";
  let dataLoaded = 6;
  fetch(`
    https://scratch.mit.edu/messages/ajax/user-activity/?user=${window.location.pathname
      .substring(7)
      .slice(0, -1)}&max=1000000`)
    .then((response) => response.text())
    .then((response) => {
      let html = new DOMParser().parseFromString(response, "text/html");
      loadMore.addEventListener("click", function () {
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
      });
    });
}
