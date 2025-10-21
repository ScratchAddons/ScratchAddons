export default async function ({ addon }) {
  async function fetchUserStats(username) {
    try {
      const response = await fetch(`https://scratchinfo.quuq.dev/api/v1/users/${username}/projectStats`);
      if (!response.ok) return null;
      const data = await response.json();
      return {
        totalLoves: data.totalLoves,
        totalFaves: data.totalFaves,
        totalRemixes: data.totalRemixes || 0,
        totalViews: data.totalViews,
      };
    } catch {
      return null;
    }
  }

  function addStatsToProfile(statsData) {
    const profileBox = document.querySelector("#profile-box .inner");
    if (!profileBox || document.querySelector(".scratch-stats-box")) return;

    const statsDiv = document.createElement("div");
    statsDiv.className = "scratch-stats-box";
    statsDiv.style.display = "flex";
    statsDiv.style.justifyContent = "space-between";
    statsDiv.style.alignItems = "center";
    statsDiv.style.padding = "10px";
    statsDiv.style.marginTop = "15px";
    statsDiv.style.fontSize = "14px";
    statsDiv.style.backgroundColor = "#f9f9f9";
    statsDiv.style.borderTop = "1px solid #ddd";

    const stats = [
      { icon: "https://scratch.mit.edu/svgs/project/love-red.svg", count: statsData.totalLoves, alt: "❤" },
      { icon: "https://scratch.mit.edu/svgs/project/fav-yellow.svg", count: statsData.totalFaves, alt: "⭐" },
      {
        icon: "https://scratch.mit.edu/svgs/project/remix-gray.svg",
        count: statsData.totalRemixes,
        alt: "🔄",
        className: "remix-icon",
      },
      {
        icon: "https://scratch.mit.edu/svgs/project/views-gray.svg",
        count: statsData.totalViews,
        alt: "👁️",
        className: "views-icon",
      },
    ];

    stats.forEach((stat) => {
      const statDiv = document.createElement("div");
      statDiv.style.display = "flex";
      statDiv.style.alignItems = "center";
      statDiv.style.gap = "6px";

      const img = document.createElement("img");
      img.src = stat.icon;
      img.alt = stat.alt;
      img.style.width = "20px";
      img.style.height = "20px";
      if (stat.className) img.classList.add(stat.className);

      const span = document.createElement("span");
      span.textContent = stat.count.toLocaleString();

      statDiv.appendChild(img);
      statDiv.appendChild(span);
      statsDiv.appendChild(statDiv);
    });

    profileBox.appendChild(statsDiv);

    const style = document.createElement("style");
    style.textContent = `
            img.views-icon { filter: invert(37%) sepia(95%) saturate(4000%) hue-rotate(200deg) brightness(95%) contrast(90%); }
            img.remix-icon { filter: invert(55%) sepia(72%) saturate(500%) hue-rotate(90deg) brightness(95%) contrast(90%); }
        `;
    document.head.appendChild(style);
  }

  const username = location.pathname.split("/")[2];
  const statsData = await fetchUserStats(username);
  if (statsData) addStatsToProfile(statsData);
}
