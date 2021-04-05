export default async ({ addon, global }) => {
  await global.onrender;
  window.scratchblocks = {};

  // Language code detection
  const forumElem = document.querySelector(".linkst ul li:nth-child(2) a");
  if (!forumElem) return;
  const forumId = /\d+/.exec(forumElem.href)[0];
  if (!forumId) return;

  await addon.tab.loadScript(addon.self.lib + "/scratchblocks-v3.5-min.js");
  await addon.tab.loadScript(addon.self.lib + "/translations-all-v3.5.js");

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
  scratchblocks.renderMatching("pre.blocks, .scratchblocks-button ul a", {
    style: "scratch3",
    languages: lang,
  });
};
