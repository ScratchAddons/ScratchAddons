export let snapOn = true;

//const ls = localStorage;

export const snapTo = {
  pageEdges: true,
  pageCenter: true,
  pageAxes: true,
  pageCorners: false,
  objectEdges: true,
  objectCenters: true,
  objectMidlines: true,
  objectCorners: false,
};
export const snapFrom = {
  boxCenter: true,
  boxCorners: false,
  boxEdgeMids: false,
};

export let threshold = 10;

export let guideColor;

/**
 *
 * @param {import("../../addon-api/content-script/typedef").UserscriptAddon} addon
 */
export function loadSettings({ settings }) {
  for (const point in snapTo) {
    if (Object.prototype.hasOwnProperty.call(snapTo, point)) setSnapTo(point, settings.get(point));
  }
  for (const point in snapFrom) {
    if (Object.prototype.hasOwnProperty.call(snapFrom, point)) setSnapFrom(point, settings.get(point));
  }
  setThreshold(settings.get("threshold"));
  toggle(settings.get("enable-default"));
}

// Will update for addon storage api, but not yet.
/*if (ls.getItem("sa-paint-snap-snapTo")) {
  const stored = JSON.parse(ls.getItem("sa-paint-snap-snapTo"));
  Object.assign(snapTo, stored);
}

if (ls.getItem("sa-paint-snap-snapFrom")) {
  const stored = JSON.parse(ls.getItem("sa-paint-snap-snapFrom"));
  Object.assign(snapFrom, stored);
}

if (ls.getItem("sa-paint-snap-threshold")) {
  const stored = JSON.parse(ls.getItem("sa-paint-snap-threshold"));
  threshold = stored;
}*/

export function setSnapTo(point, to) {
  snapTo[point] = !!to;
  //ls.setItem("sa-paint-snap-snapTo", JSON.stringify(snapTo));
}
export function setSnapFrom(point, to) {
  snapFrom[point] = !!to;
  //ls.setItem("sa-paint-snap-snapFrom", JSON.stringify(snapFrom));
}

export function setThreshold(thresh) {
  threshold = thresh;
  //ls.setItem("sa-paint-snap-threshold", JSON.stringify(threshold));
}

export function enable() {
  snapOn = true;
}

export function disable() {
  snapOn = false;
}

export function toggle(enabled) {
  if (enabled) enable();
  else disable();
}

export function setGuideColor(hex) {
  guideColor = hex;
}
