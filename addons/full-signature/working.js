export default async function ({ addon, global, console }) {
  let activityStream = document.querySelectorAll(".activity-stream li");
  let parser = new DOMParser();
  let htmlparse = parser.parseFromString(
    `
    <button class="load-more-wibd">Load More</button>
    `,
    "text/html"
  );
  document.querySelector(".activity-stream").appendChild(htmlparse.querySelector("button"));
  let dataLoaded = 6;
  let loadMore = document.querySelector(".load-more-wibd");
  loadMore.addEventListener("click", function () {
    fetch(`
      https://scratch.mit.edu/messages/ajax/user-activity/?user=${
        document.querySelector(".header-text h2").textContent
      }&max=1000000`)
      .then((response) => response.text())
      .then((response) => {
        var html = parser.parseFromString(response, "text/html");
        html.querySelectorAll("ul > li").forEach((li, index) => {
          if (index > dataLoaded && index < dataLoaded + 6) {
            activityStream[activityStream.length - 1].appendChild(li);
          }
        });
        dataLoaded += 6;
      });
  });
}
