import createSnapPoints from "./genSnapPoints.js";
import { loadModules, Modes, BitmapModes } from "./helpers.js";

import { snapOn, threshold, guideColor } from "./state.js";

const getMoveTool = (tool) => {
  return tool.boundingBoxTool._modeMap.MOVE;
};

export const updateSelectTool = (paper, tool) => {
  const lib = loadModules(paper);
  const {
    math: { checkPointsClose, snapDeltaToAngle },
    view: { getActionBounds, CENTER },
    layer: { getDragCrosshairLayer, CROSSHAIR_FULL_OPACITY, getLayer },
    guide: { hoverBounds },
  } = lib;

  const moveTool = getMoveTool(tool);

  // https://github.com/scratchfoundation/scratch-paint/blob/2a9fb2356d961200dc849b5b0a090d33f473c0b5/src/helper/selection-tools/move-tool.js

  const FADE_DISTANCE = 10;

  let guideLine = new paper.Path.Line({
    from: [0, 0],
    to: [0, 0],
    strokeColor: new paper.Color(guideColor),
    strokeWidth: 1 / paper.view.zoom,
    visible: false,
    data: {
      isHelperItem: true,
      noSelect: true,
      noHover: true,
      saPaintSnapGuide: true,
    },
    selected: false,
  });

  const guidePointParts = {
    shadow: null,
    circle: null,
  };
  const guidePoint = new paper.Group({ children: [], visible: false });

  // Paper adds them by default, and we don't want them in the canvas yet.
  guideLine.remove();
  guidePoint.remove();

  let itemIndicator;

  const fixGuideSizes = () => {
    guidePointParts.shadow = new paper.Path.Circle({
      center: new paper.Point(0, 0),
      radius: 5.5 / paper.view.zoom,
      fillColor: "black",
      opacity: 0.12,
      data: {
        isHelperItem: true,
        noSelect: true,
        noHover: true,
        saPaintSnapGuide: true,
      },
      visible: true,
      guide: true,
    });
    guidePointParts.circle = new paper.Path.Circle({
      center: new paper.Point(0, 0),
      radius: 4 / paper.view.zoom,
      fillColor: new paper.Color(guideColor),
      data: {
        isScaleHandle: false,
        isHelperItem: true,
        noSelect: true,
        noHover: true,
        saPaintSnapGuide: true,
      },
      visible: true,
      guide: true,
    });
    guidePoint.removeChildren();
    guidePoint.addChildren([guidePointParts.shadow, guidePointParts.circle]);
    guideLine.strokeWidth = 1 / paper.view.zoom;
    guideLine.strokeColor = new paper.Color(guideColor);
    guideLine.bringToFront();
    guidePoint.bringToFront();
    getLayer("isGuideLayer").addChildren([guideLine, guidePoint]);
  };

  let removeGuides;

  function onMouseDrag(event) {
    const point = event.point;
    const actionBounds = getActionBounds(this.mode in BitmapModes);

    point.x = Math.max(actionBounds.left, Math.min(point.x, actionBounds.right));
    point.y = Math.max(actionBounds.top, Math.min(point.y, actionBounds.bottom));

    const dragVector = point.subtract(event.downPoint);
    const scaledThreshold = threshold / paper.view.zoom;

    let snapVector;

    if (this.selectedItems.length === 0) {
      return;
    }
    const selectionBounds = this.selectionCenter._owner;
    const newCenter = this.selectionCenter.add(dragVector);
    const getDist = (p1, p2) => {
      return p1.getDistance(p2);
    };

    const selectionAnchor =
      getLayer("isGuideLayer").children.find((c) => c.data.isSelectionBound)?.selectionAnchor ?? {};

    const resetAnchorColor = () => {
      selectionAnchor.strokeColor = new paper.Color(0.30196078431372547, 0.592156862745098, 1);
      selectionAnchor.fillColor = null;
    };

    removeGuides = () => {
      guideLine.remove();
      guidePoint.remove();
      guidePoint.visible = false;
      guideLine.visible = false;
      itemIndicator?.remove();
      if (itemIndicator) itemIndicator.visible = false;
      resetAnchorColor();
    };

    removeGuides();

    if (!event.modifiers.shift && this.mode !== Modes.RESHAPE) {
      const paintLayer = getLayer("isPaintingLayer");

      const snapPoints = createSnapPoints(paper, selectionBounds, lib, paintLayer.children);
      const fromPoints = snapPoints.from;
      const toPoints = snapPoints.to;

      const configDefFn = (pointDef) => {
        if (!pointDef.clamp)
          pointDef.clamp = {
            min: -Infinity,
            max: Infinity,
          };
        if (pointDef.type === "point") return () => pointDef.value;
        if (pointDef.type === "xcoord" || pointDef.type === "itemSideVert")
          return (point) =>
            new paper.Point(pointDef.value, Math.min(Math.max(point.y, pointDef.clamp.min), pointDef.clamp.max));
        if (pointDef.type === "ycoord" || pointDef.type === "itemSideHoriz")
          return (point) =>
            new paper.Point(Math.min(Math.max(point.x, pointDef.clamp.min), pointDef.clamp.max), pointDef.value);
        if (pointDef.type === "generator") return pointDef.value;
      };
      const generateSnapPointsFor = (point) =>
        Object.fromEntries(
          Object.entries(toPoints).map(([k, v]) => [k, { type: v.type, point: configDefFn(v)(point) }])
        );

      const generatedSnapPoints = Object.entries(fromPoints).map(([pointPos, point]) => ({
        pointPos,
        origPoint: point,
        point: point.add(dragVector),
        snapPoints: generateSnapPointsFor(point.add(dragVector)),
      }));

      const priority = ["point", "itemSideVert", "itemSideHoriz", "xcoord", "ycoord", "generated", undefined];

      const sortByPrioOrDist = (a, b) => {
        const prioDiff = priority.indexOf(a.snapPointType) - priority.indexOf(b.snapPointType);
        if (prioDiff) return prioDiff;
        return a.distance - b.distance;
      };

      const closestSnapForEachPoint = generatedSnapPoints
        .map(({ point, origPoint, snapPoints }) => {
          const snappablePoints = Object.entries(snapPoints)
            .filter(([pos, snapPoint]) => checkPointsClose(point, snapPoint.point, scaledThreshold))
            .map(([pos, snapPoint]) => ({
              pos,
              distance: getDist(snapPoint.point, point),
              snapPointType: snapPoint.type,
            }));

          const closestSnapPoint = snappablePoints.sort(sortByPrioOrDist)[0] || {
            pos: "",
            distance: Infinity,
          };

          return {
            point: origPoint,
            snapPoint: snapPoints[closestSnapPoint.pos]?.point,
            snapPointType: snapPoints[closestSnapPoint.pos]?.type,
            distance: closestSnapPoint.distance,
            pos: closestSnapPoint.pos,
          };
        })
        .sort(sortByPrioOrDist);

      const closestSnapPoint = closestSnapForEachPoint.sort(sortByPrioOrDist)[0];
      removeGuides();
      if (closestSnapPoint?.snapPoint) {
        fixGuideSizes();
        snapVector = closestSnapPoint.snapPoint.subtract(closestSnapPoint.point);
        const itemID = closestSnapPoint.pos.match(/item_(\d+)_/)?.[1];
        if (itemID) {
          const item = paper.project.getItem({
            id: parseInt(itemID, 10),
          });

          if (item) {
            itemIndicator = hoverBounds(item);
          }
        }
        if (closestSnapPoint.point.equals(this.selectionCenter) && closestSnapPoint.snapPointType === "point") {
          selectionAnchor.fillColor = selectionAnchor.strokeColor = new paper.Color(guideColor);
        } else {
          resetAnchorColor();
          switch (closestSnapPoint.snapPointType) {
            case "point": {
              guidePoint.visible = true;
              guidePoint.position = closestSnapPoint.snapPoint;
              guidePoint.bringToFront();
              break;
            }
            case "xcoord":
            case "itemSideVert": {
              guideLine.firstSegment.point = new paper.Point(closestSnapPoint.snapPoint.x, actionBounds.top);
              guideLine.lastSegment.point = new paper.Point(closestSnapPoint.snapPoint.x, actionBounds.bottom);
              guideLine.visible = true;
              guideLine.bringToFront();
              break;
            }
            case "ycoord":
            case "itemSideHoriz": {
              guideLine.firstSegment.point = new paper.Point(actionBounds.left, closestSnapPoint.snapPoint.y);
              guideLine.lastSegment.point = new paper.Point(actionBounds.right, closestSnapPoint.snapPoint.y);
              guideLine.visible = true;
              guideLine.bringToFront();
              break;
            }
          }
        }
      }
    }

    let bounds;
    for (const item of this.selectedItems) {
      // add the position of the item before the drag started
      // for later use in the snap calculation
      if (!item.data.origPos) {
        item.data.origPos = item.position;
      }

      if (snapVector) {
        item.position = item.data.origPos.add(snapVector);
      } else if (event.modifiers.shift) {
        item.position = item.data.origPos.add(snapDeltaToAngle(dragVector, Math.PI / 4));
      } else {
        item.position = item.data.origPos.add(dragVector);
      }

      if (bounds) {
        bounds = bounds.unite(item.bounds);
      } else {
        bounds = item.bounds;
      }
    }

    if (this.firstDrag) {
      // Show the center crosshair above the selected item while dragging.
      getDragCrosshairLayer().visible = true;
      this.firstDrag = false;
    }

    // The rotation center crosshair should be opaque over the entire selection bounding box, and fade out to
    // totally transparent outside the selection bounding box.
    let opacityMultiplier = 1;
    if (
      (CENTER.y < bounds.top && CENTER.x < bounds.left) ||
      (CENTER.y > bounds.bottom && CENTER.x < bounds.left) ||
      (CENTER.y < bounds.top && CENTER.x > bounds.right) ||
      (CENTER.y > bounds.bottom && CENTER.x > bounds.right)
    ) {
      // rotation center is to one of the 4 corners of the selection bounding box
      const distX = Math.max(CENTER.x - bounds.right, bounds.left - CENTER.x);
      const distY = Math.max(CENTER.y - bounds.bottom, bounds.top - CENTER.y);
      const dist = Math.sqrt(distX * distX + distY * distY);
      opacityMultiplier = Math.max(0, 1 - dist / (FADE_DISTANCE / paper.view.zoom));
    } else if (CENTER.y < bounds.top || CENTER.y > bounds.bottom) {
      // rotation center is above or below the selection bounding box
      opacityMultiplier = Math.max(
        0,
        1 - (Math.abs(CENTER.y - newCenter.y) - bounds.height / 2) / (FADE_DISTANCE / paper.view.zoom)
      );
    } else if (CENTER.x < bounds.left || CENTER.x > bounds.right) {
      // rotation center is left or right of the selection bounding box
      opacityMultiplier = Math.max(
        0,
        1 - (Math.abs(CENTER.x - newCenter.x) - bounds.width / 2) / (FADE_DISTANCE / paper.view.zoom)
      );
    } // else the rotation center is within selection bounds, always show drag crosshair at full opacity
    getDragCrosshairLayer().opacity = CROSSHAIR_FULL_OPACITY * opacityMultiplier;
  }

  const oldMouseDrag = moveTool.constructor.prototype.onMouseDrag;
  moveTool.constructor.prototype.onMouseDrag = onMouseDrag;

  const oldMouseDown = moveTool.constructor.prototype.onMouseDown;
  moveTool.constructor.prototype.onMouseDown = function (...a) {
    if (snapOn) moveTool.constructor.prototype.onMouseDrag = onMouseDrag;
    else moveTool.constructor.prototype.onMouseDrag = oldMouseDrag;

    oldMouseDown.apply(this, a);
  };

  const oldMouseUp = moveTool.constructor.prototype.onMouseUp;
  moveTool.constructor.prototype.onMouseUp = function (...a) {
    removeGuides?.();
    oldMouseUp.apply(this, a);
  };
};

export const isSelectTool = (tool) => {
  return "selectionBoxTool" in tool && "boundingBoxTool" in tool;
};
