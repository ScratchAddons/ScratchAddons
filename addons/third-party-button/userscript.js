export default async function ({ addon, global, console }) {
  addon.settings.addEventListener("change", () => console.log("changed!"));
  await addon.tab.waitForElement(".action-buttons");

  var stageid = -1;
  function replaceStage(e, url, w, h, id) {
    e.preventDefault(); //This could be moved into the if so you can click twice on the button to get to the site
    if (id != stageid) {
      stageid = id;
      //await addon.tab.waitForElement(".guiPlayer"); //That creates an error for some reason
      var iframe = document.createElement("iframe");
      iframe.src = url + projectid;
      iframe.width = "482";
      iframe.height = "393";
      iframe.style = "border:none;";
      iframe.allowfullscreen = "true";
      iframe.allowtransparency = "true";

      const el = document.querySelector(".guiPlayer");
      el.replaceChild(iframe, el.childNodes[0]);
    }
  }

  const fork = document.createElement("a");
  const warp = document.createElement("a");

  console.log(window.location.href);
  var projectid = window.location.pathname.split("/")[2];
  console.log(projectid);

  fork.innerHTML = "<div style='margin:auto;color:white;'>forkphorus</div>";
  fork.href = "https://forkphorus.github.io/#" + projectid;
  fork.className = "button action-button";
  fork.style = "display:flex;";
  fork.addEventListener("click", (e) =>
    replaceStage(e, "https://forkphorus.github.io/embed.html?auto-start=false#", 482, 393, 0)
  );

  warp.innerHTML = "<div style='margin:auto;color:white;'>TurboWarp</div>";
  warp.href = "https://turbowarp.github.io/#" + projectid;
  warp.className = "button action-button";
  warp.style = "display:flex;";
  warp.addEventListener("click", (e) =>
    replaceStage(e, "https://turbowarp.org/embed.html?auto-start=false#", 482, 393, 1)
  );

  if (addon.settings.get("colors")) {
    fork.style = "display:flex;background-color:#1f313e;";
    warp.style = "display:flex;background-color:#ff4c4c;";
  }

  if (addon.settings.get("forkphorus")) {
    document.getElementsByClassName("action-buttons")[0].appendChild(fork);
  }
  if (addon.settings.get("turbowarp")) {
    document.getElementsByClassName("action-buttons")[0].appendChild(warp);
  }
}
