const featuredDangoProjects = [
  {
    projectId: 683954771,
    projectTitle: "Dango Clicker",
  },
  {
    projectId: 297794351,
    projectTitle: "❤️How to make Japanese Dango❤️",
  },
  {
    projectId: 538669082,
    projectTitle: "dango: the game",
  },
  {
    projectId: 754385820,
    projectTitle: "dango clicker",
  },
  {
    projectId: 619174229,
    projectTitle: "Kawaii Dango Creator!",
  },
];

// Our April Fools changes have historically lasted 48 hours
const MARCH_31_TIMESTAMP = 1680264000; // Fri, 31 Mar 2023 12:00:00 GMT
const APRIL_2_TIMESTAMP = 1680436800; // Sun, 2 Apr 2023 12:00:00 GMT
// Go to scratch.mit.edu/#dangos to bypass date check

export default async function ({ addon, console, msg }) {
  const now = new Date().getTime() / 1000;
  const runDangos = location.hash === "#dangos" || (now < APRIL_2_TIMESTAMP && now > MARCH_31_TIMESTAMP);
  if (!runDangos) return;

  // Wait until Featured Projects row loads
  const firstThumbnail = await addon.tab.waitForElement(".carousel .thumbnail");

  // Get Featured Projects row <div>
  const featuredProjectsRow = firstThumbnail.closest(".box");

  // Clone Featured Projects row and its children
  const featuredDangosRow = featuredProjectsRow.cloneNode(true);
  featuredDangosRow.classList.add("sa-featured-dangos-row");

  // At this point, the Featured Dangos row might be 5 "Project" placeholders linking to
  // /projects/1, or possibly the actual featured projects. We will be handling both cases.

  // Change row title
  featuredDangosRow.querySelector(".box-header > h4").textContent = msg("row-title");

  // Take advantage of existing empty <p> to add our own message
  featuredDangosRow.querySelector(".box-header > p").classList.add("sa-featured-dangos-message");
  featuredDangosRow.querySelector(".box-header > p").textContent = msg("note");

  featuredDangosRow.querySelectorAll(".thumbnail").forEach((project, i) => {
    // For each project
    const { projectId, projectTitle } = featuredDangoProjects[i];

    // Link to correct project
    project.querySelectorAll("a").forEach((link) => (link.href = `/projects/${projectId}/`));

    // Use correct project thumbnail
    project.querySelector("img").src = `//uploads.scratch.mit.edu/projects/thumbnails/${projectId}.png`;

    // Use correct project title
    project.querySelector("a[title]").textContent = projectTitle;
    project.querySelector("a[title]").title = projectTitle;
  });

  // Add our own row after the Featured Projects row
  featuredProjectsRow.after(featuredDangosRow);
}
