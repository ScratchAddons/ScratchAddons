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

export const eventTarget = new EventTarget();

/** @type {(point: keyof snapFrom, to: boolean) => void} */
export function setSnapFrom(point, to) {
  snapFrom[point] = !!to;
  eventTarget.dispatchEvent(
    new CustomEvent("changeSnapFrom", {
      detail: {
        point,
        value: to,
      },
    })
  );
}

/** @type {(point: keyof snapTo, to: boolean) => void} */
export function setSnapTo(point, to) {
  snapTo[point] = !!to;
  eventTarget.dispatchEvent(
    new CustomEvent("changeSnapTo", {
      detail: {
        point,
        value: to,
      },
    })
  );
}

export function enable() {
  snapOn = true;
  eventTarget.dispatchEvent(new CustomEvent("toggle"));
}

export function disable() {
  snapOn = false;
  eventTarget.dispatchEvent(new CustomEvent("toggle"));
}

export function toggle(enabled) {
  if (enabled) enable();
  else disable();
}

export let enabledAddons = [];

export function setEnabled(addons) {
  enabledAddons = addons;
}

export function addonIsEnabled(addonName) {
  return enabledAddons.includes(addonName);
}

export let threshold = 4;

export function setThreshold(thresh) {
  threshold = thresh;
}
