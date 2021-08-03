export default async function ({ addon, global, console, msg }) {
  window.scratchblocks3Enabled = true
  // thanks cubey
  function scale(svg, factor) {
    svg.setAttribute("width", svg.getAttribute("width") * factor);
    svg.setAttribute("height", svg.getAttribute("height") * factor);
  }

  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/scratchblocks-v3.5.2-min.js"); // load new scratchblocks
  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/translations-all-v3.5.2.js") // load translations

  document.querySelectorAll("pre.blocks").forEach((el) => {
    el.innerHTML = ""; // clear html
    el.innerText = el.getAttribute("data-original"); // data-original is managed by cs.js, the only way it works
  });

  const forumId = /\d+/.exec(document.querySelector(".linkst li:nth-child(2) a").href)[0]
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


  scratchblocks.renderMatching(".blockpost pre.blocks", {
    languages: lang,
    style: "scratch3",
  });

  window.scratchblocks.scale = (qs) => {
      document.querySelectorAll(qs).forEach(e => scale(e, .75))
  }
  scratchblocks.scale('.scratchblocks > svg')
}
