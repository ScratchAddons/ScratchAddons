export let snapOn = true;

const ls = localStorage;

export const snapTo = {
  pageEdges: true,
  pageCenter: true,
  pageCorners: false,
  objectEdges: true,
  objectCenters: true,
  objectCorners: false,
};
export const snapFrom = {
  boxCenter: true,
  boxCorners: false,
  boxEdgeCenters: false,
};

export let threshold = 10;

if (ls.getItem("sa-paint-snap-snapTo")) {
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
}

export function setSnapTo(point, to) {
  snapTo[point] = !!to;
  ls.setItem("sa-paint-snap-snapTo", JSON.stringify(snapTo));
}
export function setSnapFrom(point, to) {
  snapFrom[point] = !!to;
  ls.setItem("sa-paint-snap-snapFrom", JSON.stringify(snapFrom));
}

export function setThreshold(thresh) {
  threshold = thresh;
  ls.setItem("sa-paint-snap-threshold", JSON.stringify(threshold));
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
