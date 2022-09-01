export let snapOn = true;

export const snapTo = {
  pageEdges: true,
  pageCenter: true,
  pageCorners: true,
  objectEdges: true,
  objectCenters: true,
  objectCorners: true,
};

export const snapFrom = {
  boxCenter: true,
  boxCorners: true,
  boxEdgeCenters: true,
};

/** @type {(point: keyof snapTo, to: boolean) => void} */
export function setSnapTo(point, to) {
  snapTo[point] = !!to;
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

export let threshold = 4;

export function setThreshold(thresh) {
  threshold = thresh;
}
