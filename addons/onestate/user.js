export default async function ({ addon, global, console }) {
    var status = global.getOneState(document.querySelector("#profile-data > div.box-head > div > h2").innerText)
    // todo: inject the status on a user page
}