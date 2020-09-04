export default async function ({ addon, global, console }) {
  addon.settings.addEventListener("change", () => console.log("changed!"));
  await addon.tab.waitForElement(".action-buttons");

  var projectid = window.location.pathname.split("/")[2];
  var stageid = -1;
  var stageidcount = 0;

  function replaceStage(e, url, w, h, id) {
    if (!addon.settings.get("stage")) {
      return;
    }
    if (!addon.settings.get("again")) {
      e.preventDefault();
    }
    if (id != stageid) {
      e.preventDefault();
      stageid = id;
      //await addon.tab.waitForElement(".guiPlayer"); //That creates an error for some reason
      var iframe = document.createElement("iframe");
      iframe.src = url + projectid;
      iframe.width = w;
      iframe.height = h;
      iframe.style = "border:none;";
      iframe.allowfullscreen = "true";
      iframe.allowtransparency = "true";

      const el = document.querySelector(".guiPlayer");
      el.replaceChild(iframe, el.childNodes[0]);
    }
  }

  function addButton(name, text, url, color, w, h) {
    if (!addon.settings.get(name)) {
      return;
    }
    var newButton = document.createElement("a");
    var textDiv = document.createElement("div");
    textDiv.style = "margin:auto;color:white;";
    textDiv.textContent = text;
    newButton.appendChild(textDiv);
    newButton.href = url + "#" + projectid;
    newButton.className = "button action-button";
    newButton.style = "display:flex;" + (addon.settings.get("colors") ? "background-color:" + color + ";" : "");
    newButton.addEventListener("click", (e) =>
      replaceStage(e, url + "embed.html?auto-start=false#", w, h, stageidcount)
    );
    stageidcount++;

    document.querySelector(".action-buttons").appendChild(newButton);
  }

  addButton("forkphorus", "forkphorus", "https://forkphorus.github.io/", "#1f313e", 482, 393);
  addButton("turbowarp", "TurboWarp", "https://turbowarp.org/", "#ff4c4c", 482.22, 406.22);
}
