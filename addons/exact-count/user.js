export default async function ({ addon, global, console }) {
  let url = window.location.href;
  let user1 = url.substring(30, 100);
  let username = user1.substring(0, user1.indexOf("/"));
  getUserData([
    {
      boxheadName: "Shared Projects",
      url: "projects",
    },
    {
      boxheadName: "Favorite Projects",
      url: "favorites",
    },
    {
      boxheadName: "Studios I'm Following",
      url: "studios_following",
    },
    {
      boxheadName: "Studios I Curate",
      url: "studios",
    },
    {
      boxheadName: "Following",
      url: "following",
    },
    {
      boxheadName: "Followers",
      url: "followers",
    },
  ]);

  function getUserData(details) {
    for (let j = 0; j < details.length; j++) {
      let xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
          let response = xmlhttp.responseText;
          let find = response.search("<h2>");
          let follownum = response.substring(find, find + 200).match(/\(([^)]+)\)/)[1];
          let a = `${details[j].boxheadName} (${follownum})`;
          let boxHeads = document.querySelectorAll(".box-head");
          for (let i = 1; i < boxHeads.length - 1; i++) {
            let viewAll = new URL(boxHeads[i].querySelector("a").href).pathname;
            let link = viewAll.split("/users/" + username + "/")[1];
            if (link == details[j].url + "/") {
              boxHeads[i].querySelector("h4").innerText = a;
            }
          }
        }
      };
      xmlhttp.open("GET", `https://scratch.mit.edu/users/${username}/${details[j].url}/`, true);
      xmlhttp.send();
    }
  }
}
