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
    uabutton.title = `When you click this button, the user agent of ${username} will display here.`;
    uabutton.onclick = async function () {
      uabutton.title = await fetchProjects(username);
      uabutton.innerText = "Hover to get user agent";
    };
    left.appendChild(line_br);
    left.appendChild(uabutton);
  });
  async function grabAgent(projects) {
    for (let index = 0; index < projects.length; index++) {
      const project = projects[index];
      try {
        console.log("tried")
        const user_agent_req = await fetch(`https://scratchdb.lefty.one/v3/project/info/${project.id}`);
        const user_agent = await user_agent_req.json();
        return user_agent.metadata["user_agent"];
      } catch(err) {
        if (index == projects.length) {
          return "This user agent cannot be found. Try again later."
          throw err;
        } else {
          console.log("User agent.")
        }
        
      }
    }
  }
  async function fetchProjects(username) {
    const limit = 3;
    const latest_projects = await (
      await fetch(`https://api.scratch.mit.edu/users/${username}/projects/?limit=${limit}`)
    ).json();
    return await grabAgent(latest_projects);
  }
}
