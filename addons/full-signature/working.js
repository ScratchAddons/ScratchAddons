export default async function ({ addon, global, console }) {
  let activityStream = document.querySelectorAll(".activity-stream li");
  let loadMore = document.createElement("button")
  loadMore.classList.add("load-more-wibd")
  loadMore.innerText = "Load More"
  document.querySelector(".activity-stream").appendChild(loadMore);
  let dataLoaded = 6;
  loadMore.addEventListener("click", function () {
    fetch(`
      https://scratch.mit.edu/messages/ajax/user-activity/?user=${
        document.querySelector(".header-text h2").textContent
      }&max=1000000`)
      .then((response) => response.text())
      .then((response) => {
        var html = new DOMParser().parseFromString(response, "text/html"); 
        html.querySelectorAll("ul > li").forEach((li, index) => {
          if (index > dataLoaded && index < dataLoaded + 6) {
            activityStream[activityStream.length - 1].append(li);
          }
        });
        dataLoaded += 6;
      });
  });
}
