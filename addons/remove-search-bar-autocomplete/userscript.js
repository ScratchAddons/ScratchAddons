export default async function ({ addon, global, console }) {
  //Detects whether the current page is 2.0- or 3.0- styled. The search bars have different IDs depending on this, so we need to figure out which ID to use. 
  if (addon.tab.clientVersion == "scratch-www") {
    document.getElementById("frc-q-1088").autocomplete="off"
  } else {
    document.getElementById("search-input").autocomplete="off"
  }
}
