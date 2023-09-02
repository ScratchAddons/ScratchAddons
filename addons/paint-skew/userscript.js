import { addons, initialize } from "../paint-snap/compatibility.js";

export default async function ({ addon }) {
  const paper = await addon.tab.traps.getPaper();

  const addSkew = function () {
    if (!paper.tool || !paper.tool.boundingBoxTool) return;
    // ScaleTool
    const ST = paper.tool.boundingBoxTool._modeMap?.SCALE?.constructor;
    if (!ST || ST.hasSkew) {
      return;
    }
    ST.hasSkew = true;

    const ogMouseDown = ST.prototype.onMouseDown;
    ST.prototype.onMouseDown = function (hitResult, boundsPath, selectedItems) {
      if (this.active) return;
      this.index = hitResult.item.data.index;
      ogMouseDown.call(this, hitResult, boundsPath, selectedItems);
      this.skewCenter = false;
      this.lastSkx = 0;
      this.lastSky = 0;
      this.skewBounds = this.itemGroup.bounds.clone();
    };

    addons.paintSkew = function (event, original) {
      if (!this.active) return;
      if (addon.self.disabled) return original();

      const bounds = this.skewBounds;
      const doShear = (skx, sky) => {
        if (skx === 0 && sky === 0) return;

        let offcenterPosition;
        if (!this.skewCenter) {
          switch (this._getRectCornerNameByIndex(this.index)) {
            case "topCenter":
            case "leftCenter":
              offcenterPosition = this.itemGroup.position.add(new paper.Point(bounds.width / 2, bounds.height / 2));
              break;
            case "bottomCenter":
            case "rightCenter":
              offcenterPosition = this.itemGroup.position.subtract(
                new paper.Point(bounds.width / 2, bounds.height / 2)
              );
              break;
          }
        }

        const position = this.skewCenter ? this.itemGroup.position : offcenterPosition;

        const shearMult = this.skewCenter ? 2 : 1;
        // swap width and height because apparently
        // shearing is based on the dimension perpendicular
        // to the one that is being skewed
        const shearX = (skx / bounds.height) * shearMult;
        const shearY = (sky / bounds.width) * shearMult;

        this.itemGroup.shear(shearX, shearY, position);
        if (this.selectionAnchor) {
          this.selectionAnchor.shear(-shearX, -shearY);
        }
      };

      // Revert skew
      doShear(-this.lastSkx, -this.lastSky);

      this.skewCenter = event.modifiers.alt;

      let skx = 0;
      let sky = 0;
      this.lastSkx = 0;
      this.lastSky = 0;
      if ((event.modifiers.control || event.modifiers.command) && !this.isCorner) {
        // Skew
        // Reset position
        this.centered = false;
        this.itemGroup.scale(1 / this.lastSx, 1 / this.lastSy, this.pivot);
        if (this.selectionAnchor) {
          this.selectionAnchor.scale(this.lastSx, this.lastSy);
        }
        this.lastSx = 1;
        this.lastSy = 1;

        const delta = event.point.subtract(this.pivot);
        switch (this._getRectCornerNameByIndex(this.index)) {
          case "topCenter":
            delta.x *= -1;
            delta.y = 0;
            break;
          case "bottomCenter":
            delta.y = 0;
            break;
          case "leftCenter":
            delta.y *= -1;
            delta.x = 0;
            break;
          case "rightCenter":
            delta.x = 0;
            break;
          default:
            delta.x = 0;
            delta.y = 0;
        }
        skx = delta.x;
        sky = delta.y;

        doShear(skx, sky);
      } else {
        // Scale
        original();
      }
      this.lastSkx = skx;
      this.lastSky = sky;
    };

    initialize(paper, ST);
  };

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    const action = e.detail.action;
    if (
      action.type === "scratch-paint/modes/CHANGE_MODE" &&
      (action.mode === "BIT_SELECT" || action.mode === "SELECT")
    ) {
      addSkew();
    }
  });
  addSkew();
}
