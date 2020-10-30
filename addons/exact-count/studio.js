export default async function ({ addon, global, console }) {
  function countProjects(url, page, delta, callback) {
    const request = new XMLHttpRequest();
    request.open("GET", url + 40 * page);
    request.onreadystatechange = function () {
      if (request.readyState == 4) {
        let pageLen = JSON.parse(request.response).length;
        if (pageLen == 40) {
          countProjects(url, page + delta, delta, callback);
        } else if (pageLen > 0) {
          let count = 40 * page + pageLen;
          callback(count);
        } else {
          page -= delta;
          delta /= 10;
          countProjects(url, page + delta, delta, callback);
        }
      }
    };
    request.send();
  }

  if (document.querySelector("[data-count=projects]").innerText == "100+") {
    const apiUrlPrefix =
      "https://api.scratch.mit.edu/studios/" + /[0-9]+/.exec(location.pathname)[0] + "/projects/?limit=40&offset=";
    countProjects(apiUrlPrefix, 0, 100, function (count) {
      document.querySelector("[data-count=projects]").innerText = count;
    });
  }
}
