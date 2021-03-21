export default async function ({ addon }) {
  var svg = await addon.tab.waitForElement("div.scratchblocks svg, .scratchblocks-button ul a svg", {
    markAsSeen: true,
  });
  var bbox = svg.getBBox();
  svg.setAttribute("width", bbox.width + "px");
  svg.setAttribute("height", bbox.height + "px");
  svg.parentNode.setAttribute("style", `height: ${svg.getBoundingClientRect().height}px;`);
}
// This fixes extra padding below scipts.
// https://stackoverflow.com/a/14363879/11866686
