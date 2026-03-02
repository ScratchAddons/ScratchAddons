export default async function ({ addon, msg }) {
  const pageSize = 40;
  const apiUrlPrefix = "https://api.scratch.mit.edu/studios/" + /[0-9]+/.exec(location.pathname)[0] + "/projects";

  const countElement = await addon.tab.waitForElement(".studio-tab-nav > a:first-child .tab-count");
  const originalText = countElement.innerText;
  let counted = false;

  const maxRequestsPerSecond = 5;
  const minRequestDelay = 1000 / maxRequestsPerSecond;
  let lastRequestTime = 0;

  // Do nothing if the count shown by Scratch isn't 100+
  if (!originalText.includes("+")) return;

  async function getPageLength(url, page, cache) {
    if (Object.hasOwnProperty.call(cache, page)) return cache[page];
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    if (timeSinceLastRequest < minRequestDelay) {
      await new Promise((resolve) => {
        setTimeout(() => resolve(), minRequestDelay - timeSinceLastRequest);
      });
    }
    lastRequestTime = Date.now();
    const res = await fetch(`${url}?limit=${pageSize}&offset=${page * pageSize}`);
    if (res.status !== 200) throw res.status;
    const length = (await res.json()).length;
    cache[page] = length;
    return length;
  }

  async function countProjects(url) {
    let cache = {};
    let minPage = 0;
    let maxPage;
    for (maxPage = 4; ; maxPage *= 2) {
      const length = await getPageLength(url, maxPage, cache);
      if (!length) break;
      else if (length < pageSize) return maxPage * pageSize + length;
      minPage = maxPage;
    }
    while (true) {
      if (maxPage - minPage <= 1) {
        return minPage * pageSize + (await getPageLength(url, minPage, cache));
      }
      const page = (minPage + maxPage) / 2;
      const length = await getPageLength(url, page, cache);
      if (length) {
        minPage = page;
        if (length < pageSize) return page * pageSize + length;
      } else {
        maxPage = page;
      }
    }
  }

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

  // Show tooltip when "(100+)" is hovered
  const tooltip = Object.assign(document.createElement("span"), {
    className: "validation-message validation-info sa-exact-count-tooltip",
    textContent: msg("studio-tooltip"),
  });
  countElement.appendChild(tooltip);

  // Show exact count when "(100+)" is clicked
  async function onCountClick(e) {
    if (addon.self.disabled) return;
    countElement.removeEventListener("click", onCountClick);
    countElement.classList.add("sa-exact-count-loading");
    const spinnerElement = Object.assign(document.createElement("span"), {
      className: "sa-spinner",
    });
    countElement.appendChild(spinnerElement);
    tooltip.remove();
    try {
      counted = await countProjects(apiUrlPrefix);
      if (!addon.self.disabled) countElement.innerText = `(${counted})`;
    } finally {
      countElement.classList.remove("sa-exact-count-loading");
      spinnerElement.remove();
    }
  }
  countElement.addEventListener("click", onCountClick);
}
