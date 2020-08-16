addon.settings.addEventListener("change", () => console.log("changed!"));
const link = document.createElement("li");
link.innerHTML = "<a href=\"/discuss\">Discuss</a>";
link.className = "link discuss";

if(addon.tab.clientVersion === "scratch-www") {
    if(addon.settings.get("removeIdeasBtn")) document.querySelector("div#navigation div.inner ul").getElementsByTagName("li")[3].remove();
    document.querySelector("div#navigation div.inner ul").insertBefore(link, document.querySelector("div#navigation div.inner ul").getElementsByTagName("li")[3]);
} else {
    if(addon.settings.get("removeIdeasBtn")) document.querySelector("div#topnav ul.site-nav").getElementsByTagName("li")[2].remove();
    document.querySelector("div#topnav ul.site-nav").insertBefore(link, document.querySelector("div#topnav ul.site-nav").getElementsByTagName("li")[2]);
}
