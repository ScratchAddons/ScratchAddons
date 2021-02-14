export default async function ({ addon, global, console }) {
  var id = window.location.href;
  var pid = id.match(/\d/g);
  pid = pid.join("");
  addon.tab.addEventListener("urlChange", (e) => {
    console.log(event.detail.newUrl);
    console.log(event.detail.newUrl.includes("editor"));
    if (!event.detail.newUrl.includes("editor")) {
      if (!event.detail.newUrl.includes("fullscreen")) {
        target = document.getElementsByClassName("stage-wrapper_stage-wrapper_2bejr")[0];
        target.style.display = "none";
        var FPP = document.createElement("iframe");
        FPP.src = "https://turbowarp.org/" + pid + "/embed";
        FPP.width = 480;
        FPP.height = 392;
        FPP.className = "newPlayer";
        FPP.allowfullscreen = "true";
        FPP.style = "border:none;";
        document.querySelector(".guiPlayer").appendChild(FPP);
      }
    }
  });
  if (!id.includes("editor")) {
    if (!id.includes("fullscreen")) {
      console.log(id.includes("editor"));
      await addon.tab.waitForElement(".guiPlayer", { markAsSeen: true });
      var target = document.getElementsByClassName("stage-wrapper_stage-wrapper_2bejr")[0];
      target.style.display = "none";
      var FPP = document.createElement("iframe");
      FPP.src = "https://turbowarp.org/" + pid + "/embed";
      FPP.width = 480;
      FPP.height = 392;
      FPP.className = "newPlayer";
      FPP.allowfullscreen = "true";
      FPP.style = "border:none;";
      document.querySelector(".guiPlayer").appendChild(FPP);
      let alerts = await addon.tab.waitForElement(".project-info-alert");
      document.getElementsByClassName("project-info-alert")[0].remove();
    }
  }
}
