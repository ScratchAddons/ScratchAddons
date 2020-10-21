export default async function({
  addon,
  global,
  console
}) {
  let url = window.location.href;
  let user1 = url.substring(30, 100);
  let username = user1.substring(0, user1.indexOf('/'));
  let dalength = document.getElementsByClassName("box-head").length;

  getUserData({
    "boxheadName":"Shared Projects",
    "url":"projects",
    "boxNumber": 1
  });
  getUserData({
    "boxheadName":"Favorite Projects",
    "url":"favorites",
    "boxNumber": 2
  });
  getUserData({
    "boxheadName":"Studios I'm Following",
    "url":"studios_following",
    "boxNumber": 3
  });
  getUserData({
    "boxheadName":"Studios I Curate",
    "url":"studios",
    "boxNumber": 4
  });
  getUserData({
    "boxheadName":"Following",
    "url":"following",
    "boxNumber": 5
  });
  getUserData({
    "boxheadName":"Followers",
    "url":"followers",
    "boxNumber": 6
  });

  function getUserData(details) {

      let xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
          let response = xmlhttp.responseText;
          let find = response.search("<h2>");
          let follownum = response.substring(find, find + 200).match(/\(([^)]+)\)/)[1];
          let a =`${details.boxheadName} (${follownum})`;
          document.querySelectorAll(".box-head h4")[details.boxNumber-1].innerText = a
        }
      }
      xmlhttp.open('GET', `https://scratch.mit.edu/users/${username}/${details.url}/`, true);
      xmlhttp.send();
  }
}
