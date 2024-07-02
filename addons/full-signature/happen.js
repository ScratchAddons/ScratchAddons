export default async function ({ addon, console, msg }) {
  await addon.tab.waitForElement(".activity-ul li");
  let activityStream = document.querySelectorAll(".activity-ul li");
  if (activityStream.length) {
    let container = document.querySelector(".activity-ul").appendChild(document.createElement("div"));
    container.classList.add("load-more-wh-container");
    container.style.display = "none"; // overridden by userstyle if the setting is enabled
    let loadMore = container.appendChild(document.createElement("button"));
    loadMore.className = "load-more-wh button";
    loadMore.innerText = msg("load-more");
    let dataLoaded = 5;
    let fetched = [];
    let displayedFetch = [];
    loadMore.addEventListener("click", async function () {
      dataLoaded += 5;
      if (dataLoaded > fetched.length) {
        const username = await addon.auth.fetchUsername();
        const xToken = await addon.auth.fetchXToken();
        await fetch(
          `
          https://api.scratch.mit.edu/users/${username}/following/users/activity?limit=40&offset=${
            Math.floor(dataLoaded / 40) * 40
          }`,
          {
            headers: {
              "X-Token": xToken,
            },
          }
        )
          .then((response) => response.json())
          .then((rows) => {
            rows
              .filter((item) => fetched.find((item2) => item2.id === item.id) === undefined)
              .forEach((item) => fetched.push(item));
          });
      }
      updateRedux();
    });
    async function updateRedux() {
      if (!fetched.length) return; // load more hasn't been clicked yet: just use the data loaded by Scratch
      displayedFetch = fetched.slice(0, !addon.self.disabled && addon.settings.get("whathappen") ? dataLoaded : 5);
      await addon.tab.redux.dispatch({ type: "SET_ROWS", rowType: "activity", rows: displayedFetch });
      document.querySelector(".activity-ul").appendChild(container);
      if (dataLoaded > fetched.length) container.remove();
    }
    addon.self.addEventListener("disabled", updateRedux);
    addon.self.addEventListener("reenabled", updateRedux);
    addon.settings.addEventListener("change", updateRedux);
  }
}
