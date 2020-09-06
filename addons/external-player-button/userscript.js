export default async function ({ addon, global, console }) {
  addon.settings.addEventListener("change", () => console.log("changed!"));
  await addon.tab.waitForElement(".action-buttons");

  var projectid = window.location.pathname.split("/")[2];
  var stageid = -1;
  var stageidcount = 0;
  var playerurls = [];

  function replaceStage(e, url, w, h, id) {
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

      iframe.setAttribute('allowFullScreen', '');
      iframe.setAttribute('allowTransparency', '');

      const el = document.querySelector(".guiPlayer");
      el.replaceChild(iframe, el.childNodes[0]);
    }
  }

  function addButton(name, text, url, color, w, h) {
    var newButton = document.createElement("a");
    var textDiv = document.createElement("div");
    textDiv.style = "margin:auto;color:white;";
    textDiv.textContent = text;
    newButton.appendChild(textDiv);
    newButton.href = url + "#" + projectid;
    newButton.className = "button action-button";
    newButton.style =
      "display:flex;" +
      (addon.settings.get("colors") ? "background-color:" + color + ";" : "") +
      (!addon.settings.get(name) ? "display:none;" : "");
    newButton.id = "externalPlayerButton" + stageidcount;
    if (addon.settings.get("stage")) {
      newButton.addEventListener("click", (e) =>
        replaceStage(e, url + "embed.html?auto-start=false#", w, h, stageidcount)
      );
    }
    stageidcount++;

    document.querySelector(".action-buttons").appendChild(newButton);

    playerurls.push(url);
  }

  function ignorePlayerLinks() {
    var url = new URL(document.location);
    url.searchParams.append("ignoreplayerlinks", "true");
    document.location = url.toString();
  }

  function automaticallyReplace() {
    if (!addon.settings.get("stage") || !addon.settings.get("autoreplace")) {
      return;
    }

    if (new URL(document.location).searchParams.get("ignoreplayerlinks")) {
      return;
    }

    for (var i = 0; i < playerurls.length; i++) {
      for (var j = 0; j < document.getElementsByClassName("project-description").length; j++) {
        if (document.getElementsByClassName("project-description")[j].textContent.indexOf(playerurls[i]) != -1) {
          document.getElementById("externalPlayerButton" + i).click(); //Lazy and it requires "Replace stage" to be turned on but I don't care as long as it works.

          var newButton = document.createElement("a");
          var textDiv = document.createElement("div");
          textDiv.style = "margin:auto;color:white;";
          textDiv.textContent = "Scratch";
          newButton.appendChild(textDiv);
          var url = new URL(document.location);
          url.searchParams.set("ignoreplayerlinks", "true");
          newButton.href = url.toString();
          newButton.className = "button action-button";
          newButton.style =
            "display:flex;" +
            (addon.settings.get("colors") ? "background-color:orange;" /*Who knows a better orange?*/ : "");
          newButton.id = "ignorePlayerLinks";
          document.querySelector(".action-buttons").appendChild(newButton);

          return;
        }
      }
    }
  }

  addButton("forkphorus", "forkphorus", "https://forkphorus.github.io/", "#1f313e", 482, 393);
  addButton("turbowarp", "TurboWarp", "https://turbowarp.org/", "#ff4c4c", 482.22, 406.22);

  automaticallyReplace();
}
