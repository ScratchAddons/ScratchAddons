export default async function ({ addon }) {
  const username = location.pathname.split("/")[2];
  if (!username) return;

  const profileBox = document.querySelector("#profile-box .inner");
  if (!profileBox) return;

  if (document.querySelector(".scratch-stats-box")) return;

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

  const statsElements = [
    { icon: "https://scratch.mit.edu/svgs/project/love-red.svg", count: "?", alt: "❤", key: "loves" },
    { icon: "https://scratch.mit.edu/svgs/project/fav-yellow.svg", count: "?", alt: "⭐", key: "faves" },
    {
      icon: "https://scratch.mit.edu/svgs/project/remix-gray.svg",
      count: "?",
      alt: "🔄",
      className: "remix-icon",
      key: "remixes",
    },
    {
      icon: "https://scratch.mit.edu/svgs/project/views-gray.svg",
      count: "?",
      alt: "👁️",
      className: "views-icon",
      key: "views",
    },
  ];

  const domElements = {};

  statsElements.forEach((stat) => {
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
    span.textContent = stat.count;

    statDiv.appendChild(img);
    statDiv.appendChild(span);
    statsDiv.appendChild(statDiv);

    domElements[stat.key] = span;
  });

  profileBox.appendChild(statsDiv);

  const style = document.createElement("style");
  style.textContent = `
        img.views-icon { filter: invert(37%) sepia(95%) saturate(4000%) hue-rotate(200deg) brightness(95%) contrast(90%); }
        img.remix-icon { filter: invert(55%) sepia(72%) saturate(500%) hue-rotate(90deg) brightness(95%) contrast(90%); }
    `;
  document.head.appendChild(style);

  // Fetch views, loves, faves from ScratchInfo API
  try {
    const res = await fetch(`https://scratchinfo.quuq.dev/api/v1/users/${username}/projectStats`);
    const data = await res.json();
    domElements.views.textContent = Number(data.totalViews).toLocaleString();
    domElements.loves.textContent = Number(data.totalLoves).toLocaleString();
    domElements.faves.textContent = Number(data.totalFaves).toLocaleString();
  } catch (e) {
    console.error("Failed to fetch ScratchInfo stats", e);
  }

  // Calculate remixes by fetching all user projects and then fetching each project individually
  async function calculateRemixes() {
    let totalRemixes = 0;
    let offset = 0;
    const limit = 40;
    let projects;

    do {
      const res = await fetch(
        `https://api.scratch.mit.edu/users/${username}/projects/?limit=${limit}&offset=${offset}`
      );
      projects = await res.json();
      for (const project of projects) {
        try {
          const projRes = await fetch(`https://api.scratch.mit.edu/projects/${project.id}/`);
          const projData = await projRes.json();
          totalRemixes += projData.stats?.remixes || 0;
        } catch {}
      }
      offset += limit;
    } while (projects.length === limit);

    domElements.remixes.textContent = totalRemixes.toLocaleString();
  }

  calculateRemixes();
}
