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
  const commentBox = document.querySelector(
    "#content > .box:not(#profile-data):not(.slider-carousel-container):not(#page-404)"
  );
  if (!commentBox) return;
  const statsBox = document.createElement("div");
  content.insertBefore(statsBox, commentBox);
  addon.tab.displayNoneWhileDisabled(statsBox, { display: "block" });
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
  statsMoreIcon.src = addon.self.dir + "/scratchstats.png";
  const stats = document.createElement("div");
  statsBox.appendChild(stats);
  stats.className = "box-content";
  stats.innerText = msg("loading");

  fetch(`https://scratchdb.lefty.one/v3/user/info/${username}`)
    .then(async function (response) {
      stats.removeChild(stats.firstChild); // remove loading message
      const followRow = document.createElement("div");
      stats.appendChild(followRow);
      followRow.className = "sa-stats-row";
      const ranksRow = document.createElement("div");
      stats.appendChild(ranksRow);
      ranksRow.className = "sa-stats-row";
      const data = await response.json();
      followRow.appendChild(createItem(data.statistics.followers.toLocaleString(), msg("followers")));
      followRow.appendChild(
        createItem(`#${data.statistics.ranks.followers.toLocaleString()}`, msg("most-followed-global"))
      );
      followRow.appendChild(
        createItem(`#${data.statistics.ranks.country.followers.toLocaleString()}`, msg("most-followed-location"))
      );
      ranksRow.appendChild(
        createItem(
          `#${data.statistics.ranks.loves.toLocaleString()} (#${data.statistics.ranks.country.loves})`,
          msg("most-loves")
        )
      );
      ranksRow.appendChild(
        createItem(
          `#${data.statistics.ranks.favorites.toLocaleString()} (#${data.statistics.ranks.country.favorites.toLocaleString()})`,
          msg("most-favorites")
        )
      );
      ranksRow.appendChild(
        createItem(
          `#${data.statistics.ranks.views.toLocaleString()} (#${data.statistics.ranks.country.views.toLocaleString()})`,
          msg("most-views")
        )
      );
      fetch(`https://scratchdb.lefty.one/v3/user/graph/${username}/followers?range=364&segment=6`)
        .then(async function (response) {
          const historyData = await response.json();
          historyData.pop();
          await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/chart.min.js");
          const canvasContainer = document.createElement("div");
          stats.appendChild(canvasContainer);
          canvasContainer.style.position = "relative";
          canvasContainer.style.height = "400px";
          const canvas = document.createElement("canvas");
          canvasContainer.appendChild(canvas);
          const stepAvg = historyData.reduce((acc, cur) => acc + cur.value / historyData.length, 0);
          const stepLog = Math.log10(stepAvg);
          const stepSize = Math.pow(10, Math.max(Math.round(stepLog) - 1, 1));
          new Chart(canvas, {
            type: "scatter",
            data: {
              datasets: [
                {
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
              scales: {
                x: {
                  ticks: {
                    callback: (x) => new Date(x).toDateString(),
                  },
                },
                y: {
                  stepSize,
                },
              },
              plugins: {
                title: {
                  display: true,
                  text: msg("followers-title"),
                },
                tooltip: {
                  callbacks: {
                    label: (context) => `${new Date(parseInt(context.label)).toDateString()}: ${context.parsed.y}`,
                  },
                },
                legend: {
                  display: false,
                },
              },
            },
          });
        })
        .catch(() => stats.appendChild(document.createTextNode(msg("err")))); // appended so basic stats are still there, it's just the chart that's gone
    })
    .catch(() => (stats.innerText = msg("err"))); // innerText to remove loading message
}
