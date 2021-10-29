export default async function ({ addon, global, console, msg }) {
  let posts = document.querySelectorAll(".blockpost");
  // Most code was taken from my-ocular addon
  posts.forEach(async (i) => {
    let username = i.querySelector(".username").innerText;

    let left = i.querySelector(".postleft").children[0];

    let uabutton = document.createElement("a");
    addon.tab.displayNoneWhileDisabled(uabutton);
    let line_br = document.createElement("br");
    addon.tab.displayNoneWhileDisabled(line_br);
    uabutton.innerText = "Get user agent";
    uabutton.id = "user-agent-btn";
    uabutton.title = "When you click this button, the user agent will display here.";
    left.appendChild(line_br);
    left.appendChild(uabutton);
    uabutton.title = await fetchProjects(username);
    left.appendChild(uabutton)
  });
  async function grabAgent(projects) {
    for (let index = 0; index <= projects.length; index++) {
      const project = array[index];
      try {
        const user_agent = await (
          await fetch(`https://api.scratch.mit.edu/users/${username}/projects/?limit=5`)
        ).json();
      } catch {}
    }
    
  }
  async function fetchProjects(username) {
    const limit = 3;
    const latest_projects = await (
      await fetch(`https://api.scratch.mit.edu/users/${username}/projects/?limit=${limit}`)
    ).json();
    grabAgent(latest_projects);
  }
}
