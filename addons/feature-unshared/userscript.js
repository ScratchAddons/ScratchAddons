export default async function ({ addon, global, console }) {
  while (true) {
    let popup = await addon.tab.waitForElement("#featured-project-modal", { markAsSeen: true });
    let page = 1;
    while (popup.querySelector("li")) {
      popup.querySelector("li").remove();
    }
    let loadMoreText = document.querySelector("[data-control='load-more'] > span").textContent;
    popup.querySelector("[data-control='load-more']").remove();
    let loadMore = popup.querySelector(".modal-body").appendChild(document.createElement("div"));
    loadMore.setAttribute("class", "button small grey");
    loadMore.id = "sa-loadMore-projects";
    loadMore.setAttribute("style", "margin:auto;width:100%;text-align:center;");
    let text = loadMore.appendChild(document.createElement("span"));
    text.innerText = loadMoreText;
    appendOptions(page);
    loadMore.addEventListener("click", function () {
      page++;
      appendOptions(page);
    });
    function appendOptions(page) {
      fetch(`https://scratch.mit.edu/site-api/projects/all/?page=${page}&ascsort=&descsort=`)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          for (var i = 0; i < data.length; i++) {
            popup.querySelector("ul").appendChild(createOption(data[i].pk, data[i].fields.title));
          }
          if (data.length < 40) {
            loadMore.remove();
          }
        });
    }
  }
  function createOption(projectID, projectTitle) {
    let option = document.createElement("li");
    let container = option.appendChild(document.createElement("div"));
    container.setAttribute("class", "project thumb");
    container.setAttribute("data-id", projectID);
    let img = container.appendChild(document.createElement("img"));
    img.src = `//uploads.scratch.mit.edu/projects/thumbnails/${projectID}.png`;
    let title = container.appendChild(document.createElement("span"));
    title.classList.add("title");
    let link = title.appendChild(document.createElement("a"));
    link.href = `/projects/${projectID}`;
    link.innerText = projectTitle;
    return option;
  }
}
