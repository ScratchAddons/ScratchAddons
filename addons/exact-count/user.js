export default async function ({ addon, global, console }) {
  let user1 = window.location.href.substring(30, 100);
  let username = user1.substring(0, user1.indexOf("/"));
  let details = ["projects", "favorites", "studios_following", "studios", "following", "followers"];
  for (let j = 0; j < details.length; j++) {
    fetch(`https://scratch.mit.edu/users/${username}/${details[j]}/`, { credentials: "omit" })
      .then((res) => res.text())
      .then((response) => {
        let find = response.search("<h2>");
        let follownum = response.substring(find, find + 200).match(/\(([^)]+)\)/)[1];
        let boxHeads = document.querySelectorAll(".box-head");
        for (let i = 1; i < boxHeads.length - 1; i++) {
          if (boxHeads[i].querySelector('a[href^="/"]')) {
            let viewAll = new URL(boxHeads[i].querySelector("a").href).pathname;
            let link = viewAll.toLowerCase().split("/users/" + username.toLowerCase() + "/")[1];
            if (link.toLowerCase() === details[j].toLowerCase() + "/") {
              let boxheadName = boxHeads[i].querySelector("h4");
              let boxVal = boxheadName.innerText.match(/\([0-9+]+\)/g);
              if (boxVal)
                boxheadName.innerText = boxheadName.innerText.substring(0, boxheadName.innerText.indexOf(boxVal[0]));
              boxheadName.innerText += ` (${follownum})`;
              return;
            }
          }
        }
      });
  }
}
