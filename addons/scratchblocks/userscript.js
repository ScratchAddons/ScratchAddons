function scaleSVG(svg, factor) {
  if (svg.classList.contains("scaled")) return;

  svg.setAttribute("width", svg.getAttribute("width") * factor);
  svg.setAttribute("height", svg.getAttribute("height") * factor);

  svg.classList.add("scaled");
}
async function getLocales(addon) {
  const forumIdToLang = {
    13: "de",
    14: "es",
    15: "fr",
    17: "pl",
    18: "ja",
    19: "nl",
    20: "pt",
    21: "it",
    22: "he",
    23: "ko",
    24: "nb",
    25: "tr",
    26: "el",
    27: "ru",
    33: "ca",
    36: "id",
    59: "fa",
  };

  if (["settings", "search"].includes(location.pathname.split("/")[2])) {
    return ["en"];
  }

  const category = await addon.tab.waitForElement(".linkst li:nth-child(2) a");
  const forumId = /\d+/.exec(category.href)[0];

  let lang = ["en"];
  if (forumIdToLang[forumId]) {
    if (Array.isArray(forumIdToLang[forumId])) {
      lang = lang.concat(forumIdToLang[forumId]);
    } else {
      lang = ["en", forumIdToLang[forumId]];
    }
  }

  return lang;
}
export default async function ({ addon, msg }) {
  window.scratchAddons._scratchblocks3Enabled = true;

  let languages = ["en"];
  const oldScript = await addon.tab.waitForElement("script[src$='scratchblocks.js']");
  oldScript.remove();

  const [sb, loadTranslations] = await Promise.all([
    import("../../libraries/thirdparty/cs/scratchblocks.min.es.js").then((mod) => mod.default),
    import("../../libraries/thirdparty/cs/translations-all-es.js").then((mod) => mod.default),
  ]);
  window.scratchblocks = sb;
  loadTranslations(sb);

  function renderMatching(selector, options = {}) {
    const opts = {
      ...options,
      languages,
      style: "scratch3",
      read: scratchblocks.read,
      parse: scratchblocks.parse,
      render: scratchblocks.render,
      document: options.doc || document,
    };
    const elements = Array.from(opts.document.querySelectorAll(selector));
    elements.forEach((element) => {
      if (element.classList.contains("rendered")) return;
      let code = element.innerText.replace(/<br>\s?|\n|\r\n|\r/gi, "\n");
      let parsed = opts.parse(code, opts);
      let svg = opts.render(parsed, opts);
      scaleSVG(svg, 0.75);

      let container = opts.document.createElement("div");
      container.className = "scratchblocks3 scratchblocks-style-scratch3";
      container.appendChild(svg);

      element.innerHTML = "";
      element.classList.add("rendered");
      element.appendChild(container);
    });
  }

  window.scratchblocks.renderMatching = renderMatching;

  const scratchblocks = Object.freeze(window.scratchblocks);

  Object.defineProperty(window, "scratchblocks", {
    // Block other scratchblocks scripts from loading.
    value: { ...scratchblocks, replace: () => undefined, sa: true },
    writable: false,
  });

  await new Promise((resolve) => {
    if (document.readyState !== "loading") {
      resolve();
    } else {
      window.addEventListener("DOMContentLoaded", resolve, { once: true });
    }
  });

  languages = await getLocales(addon);
  const blocks = document.querySelectorAll("pre.blocks");
  if (blocks.length > 0) {
    await addon.tab.waitForElement("pre.blocks[data-original]"); // wait for cs.js to preserve the blocks
  }

  blocks.forEach((block) => {
    block.classList.remove("blocks");
    block.classList.add("blocks3");
    block.innerHTML = "";
    block.innerText = block.getAttribute("data-original");
  });

  renderMatching(".blockpost pre.blocks3");

  // Render 3.0 menu selectors

  await addon.tab.waitForElement(".scratchblocks-button");

  let i = 0;

  while (true) {
    const button = await addon.tab.waitForElement(`.scratchblocks-button ul a[title]`, {
      markAsSeen: true,
    });

    setTimeout(() => {
      // wait for any scratchblocks rendering to happen
      if (button.firstElementChild && button.firstElementChild.classList.contains("scratchblocks")) {
        button.firstElementChild.remove();
      } else if (button.firstElementChild && button.firstElementChild.classList.contains("scratchblocks3")) {
        return;
      }

      button.innerHTML = "";
      button.textContent = button.title;

      button.id = button.id || `block-${++i}`;

      renderMatching(`#${button.id}`);
    }, 200);
  }
}
