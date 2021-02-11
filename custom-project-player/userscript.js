export default async function ({ addon, global, console }) {
  var id = window.location.href;
  var pid = id.match(/\d/g);
  pid = pid.join("");

  while (1) {
    let alerts = await addon.tab.waitForElement(".project-info-alert"); // this is the thing that says that the project uses your username.
    document.getElementsByClassName("project-info-alert")[0].remove();

    let player = await addon.tab.waitForElement(".guiPlayer", { markAsSeen: true });
    var FPP = document.createElement("iframe");
    FPP.src = "https://forkphorus.github.io/embed.html?id=" + pid + "&auto-start=true&light-content=false";
    FPP.width = 480;
    FPP.height = 392;
    FPP.className = "newPlayer";
    FPP.allowfullscreen = "true";

    var target = document.getElementsByClassName("stage-wrapper_stage-wrapper_2bejr")[0];
    target.remove();

    document.querySelector(".guiPlayer").appendChild(FPP);
  }
}
