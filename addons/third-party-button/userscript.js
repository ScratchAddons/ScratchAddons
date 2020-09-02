export default async function ({ addon, global, console }) {
  addon.settings.addEventListener("change", () => console.log("changed!"));
  const viewon = document.createElement("span");

  viewon.innerHTML = "View on ";
  viewon.title = "Third-party sites";
  viewon.style = "font-size:15px;float:right;";
  console.log(window.location.href);
  var urllist = window.location.href.split("/");
  var projectid;
  for (var i = urllist.length; i >= 0 && !projectid; i--) {
    projectid = urllist[i];
  }
  console.log(projectid);

  if (addon.settings.get("forkphorus")) {
    viewon.innerHTML += '<a title="forkphorus" href="https://forkphorus.github.io/#' + projectid + '">forkphorus</a>';
  }

  if (addon.settings.get("turbowarp")) {
    if (viewon.innerHTML != "View on ") {
      viewon.innerHTML += " or ";
    }
    viewon.innerHTML += '<a title="turbowarp" href="https://turbowarp.github.io/#' + projectid + '">turbowarp</a>';
  }

  if (viewon.innerHTML != "View on ") {
    document.getElementsByClassName("project-title")[0].appendChild(viewon);
  }
}
