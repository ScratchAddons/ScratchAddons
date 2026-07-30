export default async function ({ addon }) {
  const CACHE = {
    projects: null,
    // favorites: null,
    followers: null,
    following: null,
    // studios: null,
    // studios_following: null,
  };
  const details = Object.keys(CACHE);
  const username = Scratch.INIT_DATA.PROFILE.model.username;
  const boxes = [...document.querySelectorAll(".box-head")];
  addon.self.addEventListener("disabled", () => {
    for (const cached of details) {
      if (CACHE[cached] !== null) {
        const box = getBoxHead(cached);
        const title = box.querySelector("h4");
        title.innerText = title.innerText.replace(` (${CACHE[cached]})`, "");
      }
    }
  });
  addon.self.addEventListener("reenabled", () => {
    for (const cached of details) {
      if (CACHE[cached] !== null) {
        const box = getBoxHead(cached);
        box.querySelector("h4").innerText += ` (${CACHE[cached]})`;
      }
    }
  });

  for (const detail of details) {
    if (detail === "projects") {
      const boxheadName = getBoxHead("projects")?.querySelector("h4");
      if (!boxheadName) continue;
      if (!boxheadName.innerText.endsWith("100+)")) {
        // Page already shows exact project count!
        continue;
      }
    }

    fetch(`https://scratch.mit.edu/users/${username}/${detail}/`, { credentials: "omit" })
      .then((res) => res.text())
      .then((html) => {
        const find = html.search("<h2>");
        const num = html.substring(find, find + 200).match(/\(([^)]+)\)/)[1];
        const box = getBoxHead(detail);
        if (typeof box !== "undefined") {
          const boxheadName = box.querySelector("h4");
          let boxVal = boxheadName.innerText.match(/\([0-9+]+\)/g);
          if (boxVal) {
            boxheadName.innerText = boxheadName.innerText.substring(0, boxheadName.innerText.indexOf(boxVal[0]));
          }
          CACHE[detail] = num;
          if (!addon.self.disabled) boxheadName.innerText += ` (${num})`;
        }
      })
      .catch((ex) => console.error("Error when fetching", detail, "-", ex));
  }

  function getBoxHead(type) {
    return boxes.find((box) => {
      const match = box.querySelector('a[href^="/"]');
      if (match) {
        const url = new URL(match.href);
        if (url.pathname === `/users/${username}/${type}/`) {
          return true;
        }
      }
      return false;
    });
  }
}
