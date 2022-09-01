import Modes, { BitmapModes } from "./lib/modes.js";
import { loadModule as loadMathModule } from "./helper/math.js";
import { loadModule as loadViewModule } from "./helper/view.js";
import { loadModule as loadLayerModule } from "./helper/layer.js";

import { snapFrom, snapTo, snapOn, threshold, setThreshold } from "./state.js";

const getMoveTool = (tool) => {
  return tool.boundingBoxTool._modeMap.MOVE;
};

/** @type {(paper: any, tool: any, settings: import("../../addon-api/content-script/typedef").UserscriptAddon["settings"]) => Promise<void>} */
export const updateSelectTool = (paper, tool, settings) => {
  const { checkPointsClose, snapDeltaToAngle } = loadMathModule(paper);
  const { getActionBounds, CENTER, ART_BOARD_BOUNDS, MAX_WORKSPACE_BOUNDS } = loadViewModule(paper);
  const { getDragCrosshairLayer, CROSSHAIR_FULL_OPACITY, getLayer } = loadLayerModule(paper);

  const moveTool = getMoveTool(tool);

  setThreshold(settings.get("snap-dist") || 4);

  /*
  ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │   See                                                                                                                      │
  │ https://github.com/LLK/scratch-paint/blob/2a9fb2356d961200dc849b5b0a090d33f473c0b5/src/helper/selection-tools/move-tool.js |
  └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
 */

  const FADE_DISTANCE = 10;

  const guideLine = new paper.Path.Line({
    from: [0, 0],
    to: [0, 0],
    strokeColor: "red",
    strokeWidth: 1 / paper.view.zoom,
    visible: false,
    data: {
      isHelperItem: true,
      noSelect: true,
      noHover: true,
    },
    selected: true,
  });
  const guidePointParts = {
    shadow: new paper.Path.Circle({
      center: new paper.Point(0, 0),
      radius: 5.5 / paper.view.zoom,
      fillColor: "black",
      opacity: 0.12,
      data: {
        isHelperItem: true,
        noSelect: true,
        noHover: true,
      },
      visible: true,
    }),
    circle: new paper.Path.Circle({
      center: new paper.Point(0, 0),
      radius: 4 / paper.view.zoom,
      fillColor: new paper.Color(1, 0, 0),
      data: {
        isScaleHandle: false,
        isHelperItem: true,
        noSelect: true,
        noHover: true,
      },
      visible: true,
    }),
  };
  const guidePoint = new paper.Group({ children: [guidePointParts.shadow, guidePointParts.circle], visible: false });

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
      },
      visible: true,
    });
    guidePointParts.circle = new paper.Path.Circle({
      center: new paper.Point(0, 0),
      radius: 4 / paper.view.zoom,
      fillColor: new paper.Color(1, 0, 0),
      data: {
        isScaleHandle: false,
        isHelperItem: true,
        noSelect: true,
        noHover: true,
      },
      visible: true,
    });
    guidePoint.removeChildren();
    guidePoint.addChildren([guidePointParts.shadow, guidePointParts.circle]);
    guideLine.strokeWidth = 1 / paper.view.zoom;
  };

  let hideGuides;

  moveTool.constructor.prototype.onMouseDrag = function (event) {
    guideLine.remove();
    guidePoint.remove();
    getLayer("isGuideLayer").addChildren([guideLine, guidePoint]);
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

    const resetAnchorColor = () => {
      selectionAnchor.strokeColor = new paper.Color(0.30196078431372547, 0.592156862745098, 1);
      selectionAnchor.fillColor = null;
    };

    hideGuides = () => {
      guideLine.visible = guidePoint.visible = false;
      resetAnchorColor();
    };

    const selectionAnchor = getLayer("isGuideLayer").children.find((c) => c.data.isSelectionBound).selectionAnchor;

    if (snapOn && !event.modifiers.shift && this.mode !== Modes.RESHAPE) {
      const snappingPoints = {
        ...(snapFrom.boxCenter
          ? {
              center: selectionBounds.center,
            }
          : {}),
        ...(snapFrom.boxCorners
          ? {
              topLeft: selectionBounds.topLeft,
              topRight: selectionBounds.topRight,
              bottomLeft: selectionBounds.bottomLeft,
              bottomRight: selectionBounds.bottomRight,
            }
          : {}),
        ...(snapFrom.boxEdgeCenters
          ? {
              left: new paper.Point(selectionBounds.left, selectionBounds.center.y),
              right: new paper.Point(selectionBounds.right, selectionBounds.center.y),
              top: new paper.Point(selectionBounds.center.x, selectionBounds.top),
              bottom: new paper.Point(selectionBounds.center.x, selectionBounds.bottom),
            }
          : {}),
      };

      const paintLayer = getLayer("isPaintingLayer");

      const snapPointDefs = {
        ...(snapTo.pageCenter
          ? {
              bounds_c: {
                type: "point",
                value: CENTER,
              },
              bounds_cx: {
                type: "xcoord",
                value: CENTER.x,
              },
              bounds_cy: {
                type: "ycoord",
                value: CENTER.y,
              },
            }
          : {}),
        ...(snapTo.pageEdges
          ? {
              bounds_l: {
                type: "xcoord",
                value: ART_BOARD_BOUNDS.left,
                clamp: {
                  min: ART_BOARD_BOUNDS.top,
                  max: ART_BOARD_BOUNDS.bottom,
                },
              },
              bounds_r: {
                type: "xcoord",
                value: ART_BOARD_BOUNDS.right,
                clamp: {
                  min: ART_BOARD_BOUNDS.top,
                  max: ART_BOARD_BOUNDS.bottom,
                },
              },
              bounds_t: {
                type: "ycoord",
                value: ART_BOARD_BOUNDS.top,
                clamp: {
                  min: ART_BOARD_BOUNDS.left,
                  max: ART_BOARD_BOUNDS.right,
                },
              },
              bounds_b: {
                type: "ycoord",
                value: ART_BOARD_BOUNDS.bottom,
                clamp: {
                  min: ART_BOARD_BOUNDS.left,
                  max: ART_BOARD_BOUNDS.right,
                },
              },
              bounds_lc: {
                type: "point",
                value: new paper.Point(ART_BOARD_BOUNDS.left, CENTER.y),
              },
              bounds_rc: {
                type: "point",
                value: new paper.Point(ART_BOARD_BOUNDS.right, CENTER.y),
              },
              bounds_tc: {
                type: "point",
                value: new paper.Point(CENTER.x, ART_BOARD_BOUNDS.top),
              },
              bounds_bc: {
                type: "point",
                value: new paper.Point(CENTER.x, ART_BOARD_BOUNDS.bottom),
              },
            }
          : {}),
        ...(snapTo.pageCorners
          ? {
              bounds_tl: {
                type: "point",
                value: ART_BOARD_BOUNDS.topLeft,
              },
              bounds_tr: {
                type: "point",
                value: ART_BOARD_BOUNDS.topRight,
              },
              bounds_bl: {
                type: "point",
                value: ART_BOARD_BOUNDS.bottomLeft,
              },
              bounds_br: {
                type: "point",
                value: ART_BOARD_BOUNDS.bottomRight,
              },
            }
          : {}),
        ...(snapTo.objectEdges
          ? Object.fromEntries(
              paintLayer.children
                .filter((item) => !(item.selected || item.data.isHelperItem))
                .map((item) => [
                  [
                    `item_${item.id}_r`,
                    {
                      type: "itemSideVert",
                      value: item.bounds.right,
                      clamp: {
                        min: item.bounds.top,
                        max: item.bounds.bottom,
                      },
                    },
                  ],
                  [
                    `item_${item.id}_l`,
                    {
                      type: "itemSideVert",
                      value: item.bounds.left,
                      clamp: {
                        min: item.bounds.top,
                        max: item.bounds.bottom,
                      },
                    },
                  ],
                  [
                    `item_${item.id}_t`,
                    {
                      type: "itemSideHoriz",
                      value: item.bounds.top,
                      clamp: {
                        min: item.bounds.left,
                        max: item.bounds.right,
                      },
                    },
                  ],
                  [
                    `item_${item.id}_b`,
                    {
                      type: "itemSideHoriz",
                      value: item.bounds.bottom,
                      clamp: {
                        min: item.bounds.left,
                        max: item.bounds.right,
                      },
                    },
                  ],
                ])
                .flat(1)
            )
          : {}),
        ...(snapTo.objectCenters
          ? Object.fromEntries(
              paintLayer.children
                .filter((item) => !item.selected)
                .map((item) => [
                  [
                    `item_${item.id}_c`,
                    {
                      type: "point",
                      value: item.bounds.center,
                    },
                  ],
                  [
                    `item_${item.id}_cx`,
                    {
                      type: "xcoord",
                      value: item.bounds.center.x,
                    },
                  ],
                  [
                    `item_${item.id}_cy`,
                    {
                      type: "ycoord",
                      value: item.bounds.center.y,
                    },
                  ],
                ])
                .flat(1)
            )
          : {}),
        ...(snapTo.objectCorners
          ? Object.fromEntries(
              paintLayer.children
                .filter((item) => !item.selected)
                .map((item) => [
                  [
                    `item_${item.id}_tl`,
                    {
                      type: "point",
                      value: item.bounds.topLeft,
                    },
                  ],
                  [
                    `item_${item.id}_tr`,
                    {
                      type: "point",
                      value: item.bounds.topRight,
                    },
                  ],
                  [
                    `item_${item.id}_bl`,
                    {
                      type: "point",
                      value: item.bounds.bottomLeft,
                    },
                  ],
                  [
                    `item_${item.id}_br`,
                    {
                      type: "point",
                      value: item.bounds.bottomRight,
                    },
                  ],
                ])
                .flat(1)
            )
          : {}),
      };

      if (!window.snapPointDefs) window.snapPointDefs = snapPointDefs;

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
          Object.entries(snapPointDefs).map(([k, v]) => [k, { type: v.type, point: configDefFn(v)(point) }])
        );

      const generatedSnapPoints = Object.entries(snappingPoints).map(([pointPos, point]) => ({
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
            distance: closestSnapPoint[1],
          };
        })
        .sort(sortByPrioOrDist);

      const closestSnapPoint = closestSnapForEachPoint.sort(sortByPrioOrDist)[0];
      hideGuides();
      if (closestSnapPoint?.snapPoint) {
        fixGuideSizes();
        snapVector = closestSnapPoint.snapPoint.subtract(closestSnapPoint.point);
        if (closestSnapPoint.point.equals(this.selectionCenter) && closestSnapPoint.snapPointType === "point") {
          selectionAnchor.fillColor = selectionAnchor.strokeColor = new paper.Color(1, 0, 0);
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
              guideLine.firstSegment.point = new paper.Point(closestSnapPoint.snapPoint.x, MAX_WORKSPACE_BOUNDS.top);
              guideLine.lastSegment.point = new paper.Point(closestSnapPoint.snapPoint.x, MAX_WORKSPACE_BOUNDS.bottom);
              guideLine.visible = true;
              guideLine.bringToFront();
              break;
            }
            case "ycoord":
            case "itemSideHoriz": {
              guideLine.firstSegment.point = new paper.Point(MAX_WORKSPACE_BOUNDS.left, closestSnapPoint.snapPoint.y);
              guideLine.lastSegment.point = new paper.Point(MAX_WORKSPACE_BOUNDS.right, closestSnapPoint.snapPoint.y);
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
  };

  const oldonMouseUp = moveTool.constructor.prototype.onMouseUp;

  moveTool.constructor.prototype.onMouseUp = function (...args) {
    hideGuides();
    oldonMouseUp.apply(this, args);
  };
};

export const isSelectTool = (tool) => {
  return "selectionBoxTool" in tool && "boundingBoxTool" in tool;
};
