export default async function({
  addon,
  global,
  console
}) {
  function countProjects(url, page, delta, callback) {
    const request = new XMLHttpRequest();
    request.open("GET", url + page + "/");
    request.onreadystatechange = function() {
      if (request.readyState == 4) {
        if (request.status == 200) {
          countProjects(url, page + delta, delta, callback);
        } else if (request.status == 404) {
          if (page != 1) {
            if (delta == 1) {
              const correctReq = new XMLHttpRequest();
              correctReq.open("GET", url + (page - 1) + "/");
              correctReq.onreadystatechange = function() {
                if (correctReq.readyState == 4) {
                  if (correctReq.status == 200) {
                    const parser = new DOMParser();
                    const list = parser.parseFromString(
                      "<ul id='projects'>" + correctReq.responseText + "</ul>", "text/html"
                    );
                    let count = 60 * (page - 2);
                    count += list.querySelector("#projects").querySelectorAll("ul > li").length;
                    callback(count);
                  }
                }
              };
              correctReq.send();
            } else {
              page -= delta;
              delta /= 10;
              countProjects(url, page + delta, delta, callback);
            }
          }
        }
      }
    };
    request.send();
  }

  if (document.querySelector("[data-count=projects]").innerText == "100+") {
    const studio = (/[0-9]+/).exec(location.href)[0];
    const apiUrlPrefix = "https://scratch.mit.edu/site-api/projects/in/" + studio + "/";
    countProjects(apiUrlPrefix, 1, 100, function(count) {
      document.querySelector("[data-count=projects]").innerText = count;
    });
  }
}
