export default async function ({ addon, global, console }) {
  document.querySelector(".activity-stream").insertAdjacentHTML(
    "beforeend",
    `
  <button class="load-more-wibd">Load More</button>
  `
  );
  let dataLoaded = 6;
  let loadMore = document.querySelector(".load-more-wibd");
  loadMore.addEventListener("click", function () {
    fetch(
      `https://scratch.mit.edu/messages/ajax/user-activity/?user=${
        document.querySelector(".header-text h2").innerHTML
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
          loadMore.insertAdjacentHTML(
            "beforebegin",
            `<li>${dummyEl.querySelectorAll("ul li")[dataLoaded].innerHTML}</li>`
          );
        }
        dummyEl.remove();
      });
  });
}
