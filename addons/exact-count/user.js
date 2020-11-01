export default async function ({ addon, global, console }) {
  let url = window.location.href;
  let user1 = url.substring(30, 100);
  let username = user1.substring(0, user1.indexOf("/"));
  let dalength = document.getElementsByClassName("box-head").length;
  var boxNumber = 1;
  getUserData(
    {
      boxheadName: "Shared Projects",
      url: "projects",
    },
    function () {
      getUserData(
        {
          boxheadName: "Favorite Projects",
          url: "favorites",
        },
        function () {
          getUserData(
            {
              boxheadName: "Studios I'm Following",
              url: "studios_following",
            },
            function () {
              getUserData(
                {
                  boxheadName: "Studios I Curate",
                  url: "studios",
                },
                function () {
                  getUserData(
                    {
                      boxheadName: "Following",
                      url: "following",
                    },
                    function () {
                      getUserData({
                        boxheadName: "Followers",
                        url: "followers",
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );

  function getUserData(details, callback = null) {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
        let response = xmlhttp.responseText;
        let find = response.search("<h2>");
        let follownum = response.substring(find, find + 200).match(/\(([^)]+)\)/)[1];
        let a = `${details.boxheadName} (${follownum})`;
        let current = document.querySelectorAll(".box-head h4")[boxNumber - 1];
        if (current.innerText.startsWith(details.boxheadName)) {
          current.innerText = a;
          boxNumber++;
        }
        if (callback) {
          callback();
        }
      }
    };
    xmlhttp.open("GET", `https://scratch.mit.edu/users/${username}/${details.url}/`, true);
    xmlhttp.send();
  }
}
