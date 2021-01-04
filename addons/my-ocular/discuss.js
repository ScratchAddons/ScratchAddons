export default async function ({ addon, global, console, msg }) {
  var lefts = document.querySelectorAll("div.postleft > dl");
  lefts.forEach(async (i) => {
    var username = i.children[0].innerText;

    var response = await fetch(`https://my-ocular.jeffalo.net/api/user/${username}`);
    var data = await response.json();
    var userStatus = data.status;
    var color = data.color;

    if (userStatus) {
      var br = document.createElement("br");
      var status = document.createElement("i");
      status.title = msg("status-hover");
      status.innerText = userStatus;

      var dot = document.createElement("span");
      dot.title = msg("status-hover");
      dot.style.height = "10px";
      dot.style.width = "10px";
      dot.style.marginLeft = "5px";
      dot.style.backgroundColor = "#bbb"; //default incase bad
      dot.style.borderRadius = "50%";
      dot.style.display = "inline-block";

      dot.style.backgroundColor = color;

      i.appendChild(br);
      i.appendChild(status);
      i.appendChild(dot);
    }
  });
}
