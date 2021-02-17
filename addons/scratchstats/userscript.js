function createItem(number, label) {
  const item = document.createElement("div");
  const numberDiv = document.createElement("div");
  item.appendChild(numberDiv);
  numberDiv.className = "sa-stats-number";
  numberDiv.innerText = number;
  const labelDiv = document.createElement("div");
  item.appendChild(labelDiv);
  labelDiv.innerText = label;
  return item;
}

export default async function ({ addon, msg, console }) {
  const username = location.pathname.split("/")[2];
  if (!username) return;
  const content = document.querySelector("#content");
  const commentBox = document.querySelector("#content > .box:not(#profile-data):not(.slider-carousel-container)");
  const statsBox = document.createElement("div");
  content.insertBefore(statsBox, commentBox);
  statsBox.className = "box sa-stats slider-carousel-container";
  const statsHeader = document.createElement("div");
  statsBox.appendChild(statsHeader);
  statsHeader.className = "box-head";
  const statsTitle = document.createElement("h4");
  statsHeader.appendChild(statsTitle);
  statsTitle.innerText = msg("title");
  const statsMoreLink = document.createElement("a");
  statsHeader.appendChild(statsMoreLink);
  statsMoreLink.innerText = msg("view-more");
  statsMoreLink.href = "https://scratchstats.com/" + username;
  const statsMoreIcon = document.createElement("img");
  statsMoreLink.insertBefore(statsMoreIcon, statsMoreLink.firstChild);
  statsMoreIcon.src = "https://scratchstats.com/images/icon.png";
  const stats = document.createElement("div");
  statsBox.appendChild(stats);
  stats.className = "box-content";
  stats.innerText = msg("loading");

  fetch(`https://scratchdb.lefty.one/v2/user/info/${username}`).then(async function (response) {
    stats.removeChild(stats.firstChild); // remove loading message
    const followRow = document.createElement("div");
    stats.appendChild(followRow);
    followRow.className = "sa-stats-row";
    const ranksRow = document.createElement("div");
    stats.appendChild(ranksRow);
    ranksRow.className = "sa-stats-row";
    const data = await response.json();
    followRow.appendChild(createItem(data.statistics.followers, msg("followers")));
    followRow.appendChild(createItem(`#${data.statistics.ranks.followers}`, msg("most-followed-global")));
    followRow.appendChild(createItem(`#${data.statistics.ranks.country.followers}`, msg("most-followed-location")));
    ranksRow.appendChild(
      createItem(`#${data.statistics.ranks.loves} (#${data.statistics.ranks.country.loves})`, msg("most-loves"))
    );
    ranksRow.appendChild(
      createItem(
        `#${data.statistics.ranks.favorites} (#${data.statistics.ranks.country.favorites})`,
        msg("most-favorites")
      )
    );
    ranksRow.appendChild(
      createItem(`#${data.statistics.ranks.views} (#${data.statistics.ranks.country.views})`, msg("most-views"))
    );
    fetch(`https://scratchdb.lefty.one/v2/user/history/followers/${data.sys_id}/?range=999`).then(async function (
      response
    ) {
      const historyData = (await response.json()).history;
      await addon.tab.loadScript(addon.self.lib + "/Chart.min.js");
      const canvasContainer = document.createElement("div");
      stats.appendChild(canvasContainer);
      canvasContainer.style.position = "relative";
      canvasContainer.style.height = "400px";
      const canvas = document.createElement("canvas");
      canvasContainer.appendChild(canvas);
      const chart = new Chart(canvas, {
        type: "scatter",
        data: {
          datasets: [
            {
              label: msg("followers-label"),
              data: historyData.map((item) => {
                return { x: Date.parse(item.date), y: item.value };
              }),
              fill: false,
              showLine: true,
              borderColor: "#4d97ff",
              lineTension: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          title: {
            display: true,
            text: msg("followers-title"),
          },
          scales: {
            xAxes: [
              {
                ticks: {
                  callback: (x) => new Date(x).toDateString(),
                },
              },
            ],
          },
          tooltips: {
            callbacks: {
              label: (item) => `${new Date(parseInt(item.label)).toDateString()}: ${item.value}`,
            },
          },
        },
      });
    });
  });
}
