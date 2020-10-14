export default async function ({ addon, global, console }) {
  fetch("https://api.scratch.mit.edu" + document.location.pathname).then(function(response) {
    return response.json()
  }).then(function(text) {
    let dateMod = new Date(text.history.modified)
    document.querySelector(".share-date").setAttribute("title", `Modified: ${dateMod.toLocaleString('en-us',{month:'short'})} ${dateMod.getDay()}, ${dateMod.getFullYear()}`)
  });
}
