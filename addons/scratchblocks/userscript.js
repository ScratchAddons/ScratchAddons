export default async function ({ addon, global, console, msg }) {
  // thanks cubey
  function scale(svg, factor) {
    svg.setAttribute("width", svg.getAttribute("width") * factor);
    svg.setAttribute("height", svg.getAttribute("height") * factor);
  }
  // document.querySelectorAll("pre.blocks").forEach((e) => (e.innerHTML = "Loading"));
  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/scratchblocks-v3.5.2-min.js"); // load new scratchblocks

  document.querySelectorAll("pre.blocks").forEach((el) => {
    el.innerHTML = ""; // clear html
    el.innerText = el.getAttribute("data-original");
  });

  scratchblocks.renderMatching("pre.blocks", {
    languages: ["en"],
    style: "scratch3",
  });

  for (const svg of document.querySelectorAll(".scratchblocks > svg")) {
    scale(svg, 0.75);
  }
}
