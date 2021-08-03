export default async function ({ addon, global, console, msg }) {
  window.scratchblocks3Enabled = true;
  // thanks cubey
  function scale(svg, factor) {
    svg.setAttribute("width", svg.getAttribute("width") * factor);
    svg.setAttribute("height", svg.getAttribute("height") * factor);
  }

  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/scratchblocks-v3.5.2-min.js"); // load new scratchblocks
  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/translations-all-v3.5.2.js"); // load translations

  document.querySelectorAll("pre.blocks").forEach((el) => {
    el.innerHTML = ""; // clear html
    el.innerText = el.getAttribute("data-original"); // data-original is managed by cs.js, the only way it works
  });

  const forumId = /\d+/.exec(document.querySelector(".linkst li:nth-child(2) a").href)[0];
  const forumIdToLang = {
    13: "de",
    14: "es",
    15: "fr",
    16: ["zh-cn", "zh-tw"],
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
  let lang = ["en"];
  if (forumIdToLang[forumId]) {
    if (Array.isArray(forumIdToLang[forumId])) {
      lang = lang.concat(forumIdToLang[forumId]);
    } else {
      lang = ["en", forumIdToLang[forumId]];
    }
  }

  function renderMatching(selector, options = {}) {
    const opts = {
      ...options,
      style: "scratch3",
      read: scratchblocks.read,
      parse: scratchblocks.parse,
      render: scratchblocks.render,
    };

    for (let el of [].slice.apply(document.querySelectorAll(selector))) {
      // isolate scratchblocks
      var parser = new DOMParser();
      var doc = parser.parseFromString(el.outerHTML, "text/html");
      var code = opts.read(doc.querySelector(el.tagName), opts);
      var parsed = opts.parse(code, opts);
      var svg = opts.render(parsed, opts);

      var container = doc.createElement("div");
      container.className = "scratchblocks3";
      container.appendChild(svg);
      el.innerHTML = container.outerHTML;
    }
    scratchblocks.scale(".scratchblocks3 svg")
  }
  window.scratchblocks.renderMatching = renderMatching;
  window.scratchblocks.scale = (qs) => {
    document.querySelectorAll(qs).forEach((e) => {
        if (!e.classList.contains('scaled')) {
            scale(e, 0.75)
            e.classList.add('scaled')
        }
    });
  };
  renderMatching(".blockpost pre.blocks", {
    languages: lang,
    style: "scratch3",
  });

  // Render 3.0 scratchblocks selector

  const menu = await addon.tab.waitForElement('.scratchblocks-button', {
      reduxCondition: (state) => state.scratchGui ? state.scratchGui.mode.isPlayerOnly : true
  })

  while (true) {
      const scratchblocksButton = await addon.tab.waitForElement('.scratchblocks-button ul a[title]', {
          elementCondition: (el) => !!el.querySelector('.scratchblocks svg')
      })

      scratchblocksButton.innerHTML = ""
      scratchblocksButton.innerText = scratchblocksButton.title
      scratchblocksButton.id = scratchblocksButton.title.replaceAll('\n', '-n')
      scratchblocks.renderMatching(`a[id='${scratchblocksButton.id}']`)
  }
}
