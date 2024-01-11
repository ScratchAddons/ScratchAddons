import { loadModules } from "../paint-snap/helpers.js";

export default async function ({ addon, console }) {
  window.addon = addon;
  const paper = await addon.tab.traps.getPaper();

  /**
   * Selection must be a single item or a group
   * When you have something selected, a custom pivot point will show, and when you drag it,
   * that is the point on the canvas which it rotates around (you can not rotate relative to the
   * item, because its center changes on rotation).
   * When you move the item/group, the pivot point is moved too, so that it's not rotating on the same canvas point, but
   * acts like it is relative to the item.
   * Make sure to keep all original scratch features (shift to snap to 45 degrees), and think about compat with new addon idea
   * customising the value that it snaps to when you hold shift.
   * Add an option to lock it the canvas no matter where you move the object - hexagonal
   * Pivot point, when dragged, snaps to the center of the object
   */

  // updateSelectTool.js line 114 is the selection anchor, this should be made draggable and displays new pivot point
  // Snapping addon snaps from pivot point, not center.

  // Local storage structure (don't forget localStorage only allows strings, use JSON.stringify)
  // In order to do .clone() etc on the pivots, after reading, use new paper.Point([x, y])
  const data = [
    {
      spriteId: "|f}2;)JrF-0wS)ZPxtgL",
      costumeId: "592bae6f8bb9c8d88401b54ac431f7b6",
      itemId: 10,
      pivot: {
        x: 530,
        y: 310,
      },
      locked: true, // If locked is false, pivot is changed when dragged
      // (IMPORTANT: you cant do anything relative to the object, you just have to pretend it is)
    },
  ];

  const {
    layer: { getLayer },
  } = loadModules(paper);

  const rotateTool = paper.tool.boundingBoxTool._modeMap.ROTATE;

  rotateTool.constructor.prototype.onMouseDrag = function (e) {
    // rotGroupPivot gets set to null on mouse up, thus the changed property is falsy
    // Do it this way so that we don't have to worry about changing the onMouseDown function
    if (!this.rotGroupPivot.changed) {
      this.realPivot = this.rotGroupPivot.clone();
      this.rotGroupPivot.x = data[0].pivot.x;
      this.rotGroupPivot.y = data[0].pivot.y;
      this.rotGroupPivot.changed = true;

      let v1 = e.point.subtract(this.rotGroupPivot);
      let v2 = e.point.subtract(this.realPivot);
      let angle = Math.acos(v1.dot(v2) / (v1.length * v2.length)) * (180 / Math.PI);
      angle *= e.point.x < this.rotGroupPivot.x ? -1 : 1;
      this.modifierAngle = angle;
    }

    let rotAngle = e.point.subtract(this.rotGroupPivot).angle + this.modifierAngle;
    if (e.modifiers.shift) {
      rotAngle = Math.round(rotAngle / 45) * 45;
    }

    this.rotItems.forEach((item) => {
      item.rotate(rotAngle - this.prevRot, this.rotGroupPivot);
    });

    this.prevRot = rotAngle;
  };

  const oldSetSelectionBounds = paper.tool.boundingBoxTool.setSelectionBounds;
  paper.tool.boundingBoxTool.setSelectionBounds = function () {
    oldSetSelectionBounds.call(this);

    this.boundsPath.selectionAnchor.position = new paper.Point(data[0].pivot);
  };
}
