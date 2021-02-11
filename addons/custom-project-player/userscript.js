
export default async function ({ addon, global, console }) {
  console.log("Hello, " + addon.auth.username);
  
  
 
var id = window.location.href;
var pid= id.match(/\d/g);
pid = pid.join("");
console.log(pid);


let player = await addon.tab.waitForElement(".guiPlayer");
document.getElementsByClassName("guiPlayer")[0].innerHTML = '<iframe src="https://forkphorus.github.io/embed.html?id=' + pid + '&auto-start=true&light-content=false" width="480" height="392" allowfullscreen="true" allowtransparency="true" style="border:none;"></iframe>';
}
