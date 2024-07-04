let overridden = false;

export const addons = {
  paintSkew: null,
  paintSnap: null,
};

export function initialize(paper, ScaleTool) {
  if (overridden) return;

  overridden = true;
  const ogMouseDrag = ScaleTool.prototype.onMouseDrag;
  ScaleTool.prototype.onMouseDrag = function (event) {
    if (!this.active) return;
    const callSnap = () => {
      if (addons.paintSnap) addons.paintSnap.call(this, event);
      else ogMouseDrag.call(this, event);
    };
    if (addons.paintSkew) {
      addons.paintSkew.call(this, event, callSnap);
    } else {
      callSnap();
    }
  };
}
