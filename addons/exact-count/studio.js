export default async function({
  addon,
  global,
  console
}) {
  function countProjects(url, offset, delta, callback) {
    const request = new XMLHttpRequest();
    request.open("GET", url + offset);
    request.onreadystatechange = function() {
      if (request.readyState == 4) {
        let pageLen = JSON.parse(request.response).length
        if (pageLen == 40) {
          countProjects(url, offset + delta, delta, callback);
        } else if (pageLen > 0) {
          let count = 40 * (offset-1) + pageLen;
          callback(count);
        } else {
          offset -= delta;
          delta /= 10;
          countProjects(url, offset + delta, delta, callback);
        }
      }
    }
    request.send();
  }


  if (document.querySelector("[data-count=projects]").innerText == "100+") {
    const apiUrlPrefix = "https://api.scratch.mit.edu/studios/" + (/[0-9]+/).exec(location.pathname)[0] + "/projects/?limit=40&offset=";
    countProjects(apiUrlPrefix, 0, 10000, function(count) {
      document.querySelector("[data-count=projects]").innerText = count;
    });
  }
}
