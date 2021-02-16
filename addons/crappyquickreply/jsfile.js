if (window.location.href.indexOf("scratch.mit.edu/discuss") > -1) {
  start();
  console.log("Scratch AutoReply Extension activated.")
}

function start() {
var newdiv = document.createElement('div');
newdiv.id="corner";
newdiv.style.background = "linear-gradient(#4d97ff, #66a6ff)";
newdiv.style.borderBottomRightRadius = "15px";
newdiv.style.border = "4px solid #1f8adb";
newdiv.style.width="300px";
newdiv.style.height="100%";
newdiv.style.position="fixed";
newdiv.style.padding="5px";
newdiv.style.top="30px";
newdiv.style.color="white";
document.body.appendChild(newdiv);

document.querySelector('#corner').insertAdjacentHTML(
    'afterbegin',
    ` <br><style>.a1{color:white; text-decoration:underline;} .a1:hover{color:white; text-decoration: none;}</style><font size='5px'>Scratch AutoReply</font>
    <br><font style="font-size:13pt;">General <a class="a1" href="https://scratch.mit.edu/discuss/">(Source)</a></font><br>
    <input id="copytext1" value="Hello there! It's really nice that you're trying to help, but The Scratch Team isn't looking for any more guides right now. Sorry!" readonly><button onclick="var e=document.getElementById('copytext1');
    e.select()
    e.setSelectionRange(0,99999)
    document.execCommand('copy')
    alert('Copied the text: '+e.value)">Copy</button>
    <br>
    <input id="copytext5" value="Hello! The [FORUM NAME] forum is for [FORUM DESCRIPTION]. The [url=https://scratch.mit.edu/discuss/00/]FORUM NAME[/url] forum could be a better fit for this topic." readonly><button onclick="var e=document.getElementById('copytext5');
    e.select()
    e.setSelectionRange(0,99999)
    document.execCommand('copy')
    alert('Copied the text: '+e.value)">Copy</button>
    <br>
    <input id="copytext2" value="Hello! Please do not advertise here, it can get spammy and clutter up the forum. You can advertise in the [url=https://scratch.mit.edu/discuss/8/]Show And Tell[/url] forum instead!" readonly><button onclick="var e=document.getElementById('copytext2');
    e.select()
    e.setSelectionRange(0,99999)
    document.execCommand('copy')
    alert('Copied the text: '+e.value)">Copy</button><br>
    <font style="font-size:13pt;">Questions about Scratch <a class="a1" href="https://scratch.mit.edu/discuss/4/">(Source)</a></font><br>
    <input id="copytext6" value="Hello! Since you've got your answer, i'll ask a moderator to close this topic for you." readonly><button onclick="var e=document.getElementById('copytext6');
    e.select()
    e.setSelectionRange(0,99999)
    document.execCommand('copy')
    alert('Copied the text: '+e.value)">Copy</button>
    <br><font style="font-size:13pt;">Suggestions <a class="a1" href="https://scratch.mit.edu/discuss/1/">(Source)</a></font><br>
    <input id="copytext3" value="Hello! This suggestion has been thought about before, and was rejected by the scratch team for this reason: [INSERT TOLORS QUOTE]" readonly><button onclick="var e=document.getElementById('copytext3');
    e.select()
    e.setSelectionRange(0,99999)
    document.execCommand('copy')
    alert('Copied the text: '+e.value)">Copy</button>
    <br>
    <input id="copytext4" value="Hello! Seems like this suggestion is a [url=DUPLICATEURL]Duplicate[/url]! Please continue the discussion there to avoid cluttering up the forums." readonly><button onclick="var e=document.getElementById('copytext4');
    e.select()
    e.setSelectionRange(0,99999)
    document.execCommand('copy')
    alert('Copied the text: '+e.value)">Copy</button>
    `      
  )
}
