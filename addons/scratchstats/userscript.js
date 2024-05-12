function createItem(number, label) {
  // Creates a large number with a label below
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

function createSimpleItem(data, getter, label) {
  // Used when only one number has to be displayed
  const result = getter(data);
  const number = result !== undefined ? result.toLocaleString() : "?";
  return createItem(number, label);
}

function createSimpleRankItem(data, getter, label) {
  // Used when the number is a rank: adds a number sign as a prefix
  const result = getter(data);
  const number = result !== undefined ? `#${result.toLocaleString()}` : "?";
  return createItem(number, label);
}

function createDoubleRankItem(data, globalGetter, countryGetter, label) {
  // Used to display a global rank next to a country rank
  const globalResult = globalGetter(data);
  const globalRank = globalResult !== undefined ? `#${globalResult.toLocaleString()}` : "?";
  const countryResult = countryGetter(data);
  const countryRank = countryResult !== undefined ? `#${countryResult.toLocaleString()}` : "?";
  const number = `${globalRank} (${countryRank})`;
  return createItem(number, label);
}

export default async function ({ addon, msg, console }) {
  const createStatsSection = (element, { data, loading, error } = {}) => {
    // "element" is the element whose content to replace
    // "data" is the data from ScratchDB, or null to display a placeholder

    element.className = `sa-stats-section ${loading || error ? "sa-stats-placeholder" : ""}`;
    while (element.firstChild) element.firstChild.remove();

    const followRow = document.createElement("div");
    element.appendChild(followRow);
    followRow.className = "sa-stats-row";
    followRow.appendChild(createSimpleItem(data, (data) => data?.statistics?.followers, msg("followers")));
    followRow.appendChild(
      createSimpleRankItem(data, (data) => data?.statistics?.ranks?.followers, msg("most-followed-global"))
    );
    followRow.appendChild(
      createSimpleRankItem(data, (data) => data?.statistics?.ranks?.country?.followers, msg("most-followed-location"))
    );

    const ranksRow = document.createElement("div");
    element.appendChild(ranksRow);
    ranksRow.className = "sa-stats-row";
    ranksRow.appendChild(
      createDoubleRankItem(
        data,
        (data) => data?.statistics?.ranks?.loves,
        (data) => data?.statistics?.ranks?.country?.loves,
        msg("most-loves")
      )
    );
    ranksRow.appendChild(
      createDoubleRankItem(
        data,
        (data) => data?.statistics?.ranks?.favorites,
        (data) => data?.statistics?.ranks?.country?.favorites,
        msg("most-favorites")
      )
    );
    ranksRow.appendChild(
      createDoubleRankItem(
        data,
        (data) => data?.statistics?.ranks?.views,
        (data) => data?.statistics?.ranks?.country?.views,
        msg("most-views")
      )
    );

    if (loading)
      element.appendChild(
        Object.assign(document.createElement("div"), {
          className: "sa-spinner",
        })
      );

    if (error)
      element.appendChild(
        Object.assign(document.createElement("div"), {
          className: "sa-stats-error",
          innerText: msg("err"),
        })
      );
  };

  const username = location.pathname.split("/")[2];
  if (!username) return;

  // waitForElement is necessary because the userscript doesn't have runAtComplete
  const content = await addon.tab.waitForElement("#content");
  // #content exists, its children might not
  const commentBox = await addon.tab.waitForElement(
    "#content > .box:not(#profile-data):not(.slider-carousel-container):not(#page-404)"
  );
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

  const statsSection = document.createElement("div");
  stats.appendChild(statsSection);
  createStatsSection(statsSection, { loading: true });

  const chartSection = Object.assign(document.createElement("div"), {
    className: "sa-chart-section",
  });
  stats.appendChild(chartSection);
  const chartLoadingSpinner = Object.assign(document.createElement("div"), {
    className: "sa-spinner",
  });
  chartSection.appendChild(chartLoadingSpinner);

  fetch(`https://scratchdb.lefty.one/v3/user/info/${username}`)
    .then(async function (response) {
      const data = await response.json();
      createStatsSection(statsSection, { data });
    })
    .catch(() => createStatsSection(statsSection, { error: true }));

  fetch(`https://scratchdb.lefty.one/v3/user/graph/${username}/followers?range=364&segment=6`)
    .then(async (response) => {
      const historyData = await response.json();
      if (historyData.length === 0) throw new Error("scratchstats: No history data");
      chartLoadingSpinner.remove();
      await addon.tab.loadScript("/libraries/thirdparty/cs/chart.min.js");
      const canvas = document.createElement("canvas");
      chartSection.appendChild(canvas);
      canvas.id = "sa-scratchstats-chart";

      const textColor = "#575e75";
      const lineColor = "rgba(0, 0, 0, 0.1)";
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
              borderColor: "#855cd6",
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
                color: textColor,
              },
              grid: {
                borderColor: textColor,
                tickColor: textColor,
                color: lineColor,
              },
            },
            y: {
              ticks: {
                stepSize,
                color: textColor,
              },
              grid: {
                borderColor: textColor,
                tickColor: textColor,
                color: lineColor,
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: msg("followers-title"),
              color: textColor,
            },
            tooltip: {
              callbacks: {
                label: (context) => `${new Date(Number(context.raw.x)).toDateString()}: ${context.parsed.y}`,
              },
            },
            legend: {
              display: false,
            },
          },
        },
      });
    })
    .catch(() => {
      chartLoadingSpinner.remove();
      chartSection.classList.add("sa-stats-placeholder");
      chartSection.appendChild(
        Object.assign(document.createElement("div"), {
          className: "sa-stats-error",
          innerText: msg("err-chart"),
        })
      );
    });
}
