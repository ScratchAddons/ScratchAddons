import getWhatsHappeningData from "./load-happen.js";

export default async function ({ addon, global, console, msg }) {
  //if (addon.self.getEnabledAddons("community").includes("whats-happening-filter")) return;
  await addon.tab.waitForElement(".activity-ul li");
  let activityStream = document.querySelectorAll(".activity-ul li");
  if (activityStream.length) {
    let container = document.querySelector(".activity-ul").appendChild(document.createElement("div"));
    container.classList.add("load-more-wh-container");
    let loadMore = container.appendChild(document.createElement("button"));
    loadMore.className = "load-more-wh button";
    loadMore.innerText = msg("load-more");
    let dataLoaded = 5;
    let fetched = [];
    let displayedFetch = [];
    loadMore.addEventListener("click", async function () {
      dataLoaded += 5;
      if (dataLoaded > fetched.length) {
        let fetchList = await getWhatsHappeningData({ addon, console, dataLoaded });
        if (fetched != fetchList) fetched.push.apply(fetched, fetchList);
      }
      updateRedux();
    });
    async function updateRedux() {
      displayedFetch = fetched.slice(0, dataLoaded);
      await addon.tab.redux.dispatch({ type: "SET_ROWS", rowType: "activity", rows: displayedFetch });
      document.querySelector(".activity-ul").appendChild(container);
      if (dataLoaded > fetched.length) container.remove();
    }
    addon.tab.displayNoneWhileDisabled(loadMore);
    addon.self.addEventListener("disabled", () => {
      dataLoaded = 5;
      updateRedux();
    });
  }
}
