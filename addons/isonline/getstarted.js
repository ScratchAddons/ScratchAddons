export default async function ({ addon, global, console, msg }) {
  if (window.location.href !== "https://scratch.mit.edu/accounts/settings/isonline") return;
  let content = document.querySelector(".box-content");
  let isLoggedIn = await addon.auth.fetchIsLoggedIn();
  let res = await fetch("https://projects.scratch.mit.edu/", {
    body: '{"targets":[{"isStage":true,"name":"Stage","variables":{"`jEk@4|i[#Fk?(8x)AV.-my variable":["my variable",0]},"lists":{},"broadcasts":{},"blocks":{},"comments":{},"currentCostume":0,"costumes":[{"name":"backdrop1","dataFormat":"svg","assetId":"cd21514d0531fdffb22204e0ec5ed84a","md5ext":"cd21514d0531fdffb22204e0ec5ed84a.svg","rotationCenterX":240,"rotationCenterY":180}],"sounds":[{"name":"pop","assetId":"83a9787d4cb6f3b7632b4ddfebf74367","dataFormat":"wav","format":"","rate":48000,"sampleCount":1123,"md5ext":"83a9787d4cb6f3b7632b4ddfebf74367.wav"}],"volume":100,"layerOrder":0,"tempo":60,"videoTransparency":50,"videoState":"on","textToSpeechLanguage":null},{"isStage":false,"name":"Sprite1","variables":{},"lists":{},"broadcasts":{},"blocks":{},"comments":{},"currentCostume":0,"costumes":[{"name":"costume1","bitmapResolution":1,"dataFormat":"svg","assetId":"bcf454acf82e4504149f7ffe07081dbc","md5ext":"bcf454acf82e4504149f7ffe07081dbc.svg","rotationCenterX":48,"rotationCenterY":50},{"name":"costume2","bitmapResolution":1,"dataFormat":"svg","assetId":"0fb9be3e8397c983338cb71dc84d0b25","md5ext":"0fb9be3e8397c983338cb71dc84d0b25.svg","rotationCenterX":46,"rotationCenterY":53}],"sounds":[{"name":"Meow","assetId":"83c36d806dc92327b9e7049a565c6bff","dataFormat":"wav","format":"","rate":48000,"sampleCount":40681,"md5ext":"83c36d806dc92327b9e7049a565c6bff.wav"}],"volume":100,"layerOrder":1,"visible":true,"x":0,"y":0,"size":100,"direction":90,"draggable":false,"rotationStyle":"all around"}],"monitors":[],"extensions":[],"meta":{"semver":"3.0.0","vm":"1.2.4","agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36"}}',
    method: "POST",
    mode: "cors",
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
  });
  let data = await res.json();
  
  content.innerHTML = isLoggedIn
    ? `<div>
  <h1>Get Started With IsOnline</h1>
  <ol>
    <li>
      Add this code to your What I'm Working On: <input disabled
      value="IO:${data["content-name"]}:">.
    </li>
  </ol>
  Note: Do not edit or remove the text or IsOnline will no longer show whether
  you are online.
</div>
`
    : `<div id="app"><h1>Login to start</h1></div>`;
  content.style.textAlign = "revert";
  content.style.paddingLeft = "10px";
}
