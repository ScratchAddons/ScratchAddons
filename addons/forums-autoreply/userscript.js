export default async function ({ addon, global, console }) {
function start(){
// Create the sidebar
var e = document.createElement("div");
e.id="corner"
e.style.background="linear-gradient(#4d97ff, #66a6ff)"
e.style.borderBottomRightRadius="15px"
e.style.border="4px solid #1f8adb"
e.style.width="350px"
e.style.height="45%"
e.style.position="fixed"
e.style.padding="5px"
e.style.top="30px"
e.style.color="white"
e.style.padding="25px"
document.body.appendChild(e)
// Assign HTML to sidebar
document.querySelector("#corner").insertAdjacentHTML("afterbegin",`<font style="font-size: 24px;">Scratch AutoReply Extension</font><br><br>
<font style="font-size: 17px;">General</font>
<br>
<button onclick="document.getElementById('id_body').innerText += 'Hey there! This is not the right place to advertise. Please use the [url=https://scratch.mit.edu/discuss/8/]Show And Tell[/url] Forum or your forum signature. Thanks!';document.getElementById('corner').style.display = 'none';">Advertising</button>
<br>
<button onclick="document.getElementById('id_body').innerText += 'Hey there! It is nice that you are trying to help, but the Scratch Team is not currently looking for any guides at this time. Feel free to make a project instead! Thanks.'; document.getElementById('corner').style.display = 'none';">Guides</button>
<br>
<br>
<font style="font-size: 17px;">Suggestions</font>
<br>
<button onclick="document.getElementById('id_body').innerText += 'This suggestion has been considered before and rejected for the following reason: [quote=The Official List of Rejected Suggestions]INSERT QUOTE FROM TOLORS HERE[/quote]. Next time, please check out the list of [url=https://scratch.mit.edu/discuss/topic/343602/]Rejected Suggestions[/url] before you post here.';document.getElementById('corner').style.display = 'none';">Rejected Suggestion</button>
<br>
<button onclick="document.getElementById('id_body').innerText += 'Hey there! It seems like this suggestion was already suggested before, in this topic [link=URL]right here[/link]. Please continue the discussion over there to keep all topics in place.'; document.getElementById('corner').style.display = 'none';">Duplicate</button>
<br>
<br>
<font style="font-size: 17px;">Questions about Scratch</font>
<br>
<button onclick="document.getElementById('id_body').innerText += 'The Questions About Scratch forum is for users to ask and receive answers about Scratch. It is nice that you want to help, but posting random information is not really the best way to do it. It clutters up the forum and potentially diverts attention from those who actually need help. Feel free to create a project instead! Thanks.'; document.getElementById('corner').style.display = 'none';">Information</button>
<br>
<br>
<button onclick="document.getElementById('corner').style.display = 'none';">Close</button>`)}console.log("Scratch AutoReply Extension activated.");
start()
}
