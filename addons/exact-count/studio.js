export default async function ({ addon }) {
  function countProjects(url, page, delta, callback) {
    const request = new XMLHttpRequest();
    request.open("GET", url + 40 * page);
    request.onreadystatechange = function () {
      if (request.readyState === 4) {
        let pageLen = JSON.parse(request.response).length;
        if (pageLen === 40) {
          countProjects(url, page + delta, delta, callback);
        } else if (pageLen > 0) {
          let count = 40 * page + pageLen;
          callback(count);
        } else if (pageLen === 0 && page === 0) {
          callback(0);
        } else {
          page -= delta;
          delta /= 10;
          countProjects(url, page + delta, delta, callback);
        }
      }
    };
    request.send();
  }
  const apiUrlPrefix =
    "https://api.scratch.mit.edu/studios/" + /[0-9]+/.exec(location.pathname)[0] + "/projects/?limit=40&offset=";
  const initialDelta = 100;
  const countElement = await addon.tab.waitForElement(".studio-tab-nav > a:first-child .tab-count");
  countProjects(apiUrlPrefix, 0, initialDelta, function (count) {
    countElement.innerText = `(${count})`;
  });
}
