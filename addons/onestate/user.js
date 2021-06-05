export default async function ({ addon, global, console }) {
    var {online, richpresense, richpresenseurl} = global.getOneState(document.querySelector("#profile-data > div.box-head > div > h2").innerText)
    var onlinetext
    if (!richpresense){
        onlinetext = online.toString()
    }else{
        onlinetext = richpresense.toString()
    }
    // todo: inject the string onlinetext as a link to richpresenseurl if it avalible and not ""
}