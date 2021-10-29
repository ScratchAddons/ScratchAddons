export default async function ({ addon, global, console, msg }) {
    let posts = document.querySelectorAll(".blockpost");
  
    posts.forEach(async (i) => {
      let username = i.querySelector(".username").innerText;
  
      let left = i.querySelector(".postleft").children[0];
  
      const userAgent = await fetchAgent(username);
  
      if (userAgent) {
        console.log("User agent found.")
      }
    });
    async function grabAgent(projects) {  
        try {
  
        } catch {
            
        }
      }
    async function fetchAgent(username) {  
      const latest_projects = await (await fetch(`https://api.scratch.mit.edu/users/${username}/projects/?limit=5`)).json();
      grabAgent(latest_projects)
    }
  }
  