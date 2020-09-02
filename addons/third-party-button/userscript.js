export default async function ({ addon, global, console }) {
  addon.settings.addEventListener("change", () => console.log("changed!"));
  const fork = document.createElement("a");
  const warp = document.createElement("a");
  
  console.log(window.location.href);
  var projectid = window.location.pathname.split("/")[2];
  console.log(projectid);
  
  fork.innerHTML = "<div style='margin:auto;color:white;'>forkphorus</div>";
  fork.href = "https://forkphorus.github.io/#" + projectid;
  fork.className = "button action-button";
  fork.style = "display:flex;";
  
  warp.innerHTML = "<div style='margin:auto;color:white;'>TurboWarp</div>";
  warp.href = "https://turbowarp.github.io/#" + projectid;
  warp.className = "button action-button";
  warp.style = "display:flex;";
  
  if (addon.settings.get("colors")) {
    fork.style = "display:flex;background-color:black;";
    warp.style = "display:flex;background-color:red;";//if you know a better color, tell me.
  }
  
  if (addon.settings.get("forkphorus")) {
    document.getElementsByClassName("action-buttons")[0].appendChild(fork);
  }
  if (addon.settings.get("turbowarp")) {
    document.getElementsByClassName("action-buttons")[0].appendChild(warp);
  }
}