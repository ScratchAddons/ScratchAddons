export default async function ({ addon, console, msg }) {
  // Fetch projects from a studio
  const fetchStudio = async (studio) => {
    const response = await fetch(`https://api.scratch.mit.edu/studios/${studio}/projects/`);
    return response.json();
  };

  const projects = await fetchStudio("33286407");

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

  featuredDangosRow.querySelectorAll(".thumbnail").forEach((project, i) => {
    // For each project
    const { id, title, username } = projects[i];

    // Link to correct project
    project.querySelectorAll("a").forEach((link) => (link.href = `/projects/${id}/`));

    // Use correct project thumbnail
    project.querySelector("img").src = `//uploads.scratch.mit.edu/projects/thumbnails/${id}.png`;

    // Use correct project title
    project.querySelector("a[title]").textContent = title;
    project.querySelector("a[title]").title = title;

    // Use correct project author, skip if element doesn't exist.
    const author = project.querySelector(".thumbnail-creator")?.firstElementChild;
    if (author) {
      author.textContent = username;
      author.href = `/users/${username}/`;
    }
  });

  // Add our own row after the Featured Projects row
  featuredProjectsRow.after(featuredDangosRow);
}
