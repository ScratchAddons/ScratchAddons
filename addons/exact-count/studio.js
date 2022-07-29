export default async function ({ addon }) {
  async function countProjects(url, page, delta) {
    const res = await fetch(url + 40 * page);
    const data = await res.json();
    let pageLen = data.length;
    if (pageLen === 40) {
      return countProjects(url, page + delta, delta);
    } else if (pageLen > 0) {
      let count = 40 * page + pageLen;
      return count;
    } else if (pageLen === 0 && page === 0) {
      return 0;
    } else {
      page -= delta;
      delta /= 10;
      return countProjects(url, page + delta, delta);
    }
  }
  const apiUrlPrefix =
    "https://api.scratch.mit.edu/studios/" + /[0-9]+/.exec(location.pathname)[0] + "/projects/?limit=40&offset=";
  const initialDelta = 100;
  const countElement = await addon.tab.waitForElement(".studio-tab-nav > a:first-child .tab-count");
  const originalText = countElement.innerText;
  let counted = false;
  addon.self.addEventListener("disabled", () => {
    if (typeof counted === "number") {
      countElement.innerText = originalText;
    }
  });
  addon.self.addEventListener("reenabled", () => {
    if (typeof counted === "number") {
      countElement.innerText = `(${counted})`;
    }
  });

  counted = await countProjects(apiUrlPrefix, 0, initialDelta);
  if (!addon.self.disabled) countElement.innerText = `(${counted})`;
}
