export default async function ({ addon, global, console }) {
  let activityStream = document.querySelectorAll(".activity-stream li")
  let parser = new DOMParser();
  let htmlparse = parser.parseFromString(`
    <button class="load-more-wibd">Load More</button>
    `, 'text/html');
  document.querySelector(".activity-stream").appendChild(htmlparse.querySelector("button"));
  let dataLoaded = 6;
  let loadMore = document.querySelector(".load-more-wibd");
  loadMore.addEventListener("click", function () {
    fetch(
      `https://scratch.mit.edu/messages/ajax/user-activity/?user=${
        document.querySelector(".header-text h2").textContent
      }&max=1000000`
    )
      .then(function (response) {
        return response.text();
      })
      .then(function (text) {
        let dummyEl = document.createElement("div");
        dummyEl.innerHTML = text;
        let lastDataLoad = dataLoaded;
        for (; dataLoaded < lastDataLoad + 6; dataLoaded++) {
          htmlparse = parser.parseFromString(`
            <li>${dummyEl.querySelectorAll("ul li")[dataLoaded].innerHTML}</li>
            `, 'text/html');
          activityStream[activityStream.length-1].appendChild(htmlparse.querySelector("li"));
        }
        dummyEl.remove();
      });
  });
}
