export default async function ({ addon, global, console }) {
    var data = (await fetch(`https://state.onedot.cf/api/v1/user/${document.querySelector("#profile-data > div.box-head > div > h2").innerText}`)).json()
    var { online, richpresense, richpresenseurl } = await data
    var onlinetext
    if (!richpresense) {
        console.log(online)
        if (online) {
            onlinetext = "Online"
        } else {
            onlinetext = "Offline or not a OneState User"
        }
    } else {
        onlinetext = richpresense.toString()
    }
    // the following code is based off of the my-ocular addon
    var statusSpan = document.createElement("a");
    statusSpan.innerText = onlinetext;
    if (richpresenseurl) {
        statusSpan.href = richpresenseurl
    }
    var container = document.querySelector(".profile-details");
    container.appendChild(statusSpan);
}