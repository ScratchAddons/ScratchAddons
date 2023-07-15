import createScalePoints from "./genScalePoints.js";
import createSnapPoints from "./genSnapPoints.js";
import { loadModules, Modes, BitmapModes } from "./helpers.js";

import { snapOn, threshold, guideColor } from "./state.js";

const getScaleTool = (tool) => {
  return tool.boundingBoxTool._modeMap.SCALE;
};

export const updateScaleTool = (paper, tool) => {
  const lib = loadModules(paper);
  const {
    view: { getActionBounds },
    layer: { getLayer },
  } = lib;

  const scaleTool = getScaleTool(tool);

  // https://github.com/LLK/scratch-paint/blob/develop/src/helper/selection-tools/scale-tool.js
  const MIN_SCALE_FACTOR = 0.0001;

  const selectionSizeGuide = {
    endLeft: new paper.Path.Line({
      from: [0, 0],
      to: [0, 0],
      strokeColor: new paper.Color(guideColor),
      strokeWidth: 1 / paper.view.zoom,
      visible: true,
      data: {
        isHelperItem: true,
        noSelect: true,
        noHover: true,
        saPaintSnapGuide: true,
      },
      selected: false,
    }),
    endRight: new paper.Path.Line({
      from: [0, 0],
      to: [0, 0],
      strokeColor: new paper.Color(guideColor),
      strokeWidth: 1 / paper.view.zoom,
      visible: true,
      data: {
        isHelperItem: true,
        noSelect: true,
        noHover: true,
        saPaintSnapGuide: true,
      },
      selected: false,
    }),
    line: new paper.Path.Line({
      from: [0, 0],
      to: [0, 0],
      strokeColor: new paper.Color(guideColor),
      strokeWidth: 1 / paper.view.zoom,
      visible: true,
      data: {
        isHelperItem: true,
        noSelect: true,
        noHover: true,
        saPaintSnapGuide: true,
      },
      selected: false,
    }),
    group: new paper.Group({ children: [], visible: false }),
  };
  const matchingSizeGuide = {
    endLeft: new paper.Path.Line({
      from: [0, 0],
      to: [0, 0],
      strokeColor: new paper.Color(guideColor),
      strokeWidth: 1 / paper.view.zoom,
      visible: true,
      data: {
        isHelperItem: true,
        noSelect: true,
        noHover: true,
        saPaintSnapGuide: true,
      },
      selected: false,
    }),
    endRight: new paper.Path.Line({
      from: [0, 0],
      to: [0, 0],
      strokeColor: new paper.Color(guideColor),
      strokeWidth: 1 / paper.view.zoom,
      visible: true,
      data: {
        isHelperItem: true,
        noSelect: true,
        noHover: true,
        saPaintSnapGuide: true,
      },
      selected: false,
    }),
    line: new paper.Path.Line({
      from: [0, 0],
      to: [0, 0],
      strokeColor: new paper.Color(guideColor),
      strokeWidth: 1 / paper.view.zoom,
      visible: true,
      data: {
        isHelperItem: true,
        noSelect: true,
        noHover: true,
        saPaintSnapGuide: true,
      },
      selected: false,
    }),
    group: new paper.Group({ children: [], visible: false }),
  };

  selectionSizeGuide.endLeft.remove();
  matchingSizeGuide.endLeft.remove();
  selectionSizeGuide.endRight.remove();
  matchingSizeGuide.endRight.remove();
  selectionSizeGuide.line.remove();
  matchingSizeGuide.line.remove();
  selectionSizeGuide.group.remove();
  matchingSizeGuide.group.remove();

  selectionSizeGuide.group.addChildren([
    selectionSizeGuide.endLeft,
    selectionSizeGuide.line,
    selectionSizeGuide.endRight,
  ]);
  matchingSizeGuide.group.addChildren([matchingSizeGuide.endLeft, matchingSizeGuide.line, matchingSizeGuide.endRight]);

  let axisLineX = new paper.Path.Line({
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
      axis: "x",
    },
    selected: false,
  });
  let axisLineY = new paper.Path.Line({
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
      axis: "y",
    },
    selected: false,
  });
  axisLineX.remove();
  axisLineY.remove();

  const fixGuideSizes = () => {
    axisLineX.strokeWidth = 1 / paper.view.zoom;
    axisLineY.strokeWidth = 1 / paper.view.zoom;
    axisLineX.strokeColor = new paper.Color(guideColor);
    axisLineY.strokeColor = new paper.Color(guideColor);

    selectionSizeGuide.endLeft.strokeWidth = 1 / paper.view.zoom;
    matchingSizeGuide.endLeft.strokeWidth = 1 / paper.view.zoom;
    selectionSizeGuide.endRight.strokeWidth = 1 / paper.view.zoom;
    matchingSizeGuide.endRight.strokeWidth = 1 / paper.view.zoom;
    selectionSizeGuide.line.strokeWidth = 1 / paper.view.zoom;
    matchingSizeGuide.line.strokeWidth = 1 / paper.view.zoom;

    selectionSizeGuide.endLeft.strokeColor = new paper.Color(guideColor);
    matchingSizeGuide.endLeft.strokeColor = new paper.Color(guideColor);
    selectionSizeGuide.endRight.strokeColor = new paper.Color(guideColor);
    matchingSizeGuide.endRight.strokeColor = new paper.Color(guideColor);
    selectionSizeGuide.line.strokeColor = new paper.Color(guideColor);
    matchingSizeGuide.line.strokeColor = new paper.Color(guideColor);

    axisLineX.bringToFront();
    axisLineY.bringToFront();
    getLayer("isGuideLayer").addChildren([axisLineY, axisLineX, selectionSizeGuide.group, matchingSizeGuide.group]);
  };

  const priority = ["width", "height", "itemSideVert", "itemSideHoriz", "xcoord", "ycoord", "generated", undefined];

  const removeGuides = () => {
    selectionSizeGuide.group.remove();
    selectionSizeGuide.group.visible = false;

    matchingSizeGuide.group.remove();
    matchingSizeGuide.group.visible = false;

    axisLineX.remove();
    axisLineX.visible = false;
    axisLineY.remove();
    axisLineY.visible = false;
  };

  scaleTool.constructor.prototype.onMouseDrag = function (event) {
    if (!this.active) return;
    const point = event.point;
    const bounds = getActionBounds(this.isBitmap);
    point.x = Math.max(bounds.left, Math.min(point.x, bounds.right));
    point.y = Math.max(bounds.top, Math.min(point.y, bounds.bottom));

    if (!this.lastPoint) this.lastPoint = event.lastPoint;

    const delta = point.subtract(this.lastPoint);
    this.lastPoint = point;

    if (event.modifiers.alt) {
      this.centered = true;
      this.itemGroup.position = this.origCenter;
      this.pivot = this.origCenter;
    } else {
      if (this.centered) {
        // Reset position if we were just in alt
        this.centered = false;
        this.itemGroup.scale(1 / this.lastSx, 1 / this.lastSy, this.pivot);
        if (this.selectionAnchor) {
          this.selectionAnchor.scale(this.lastSx, this.lastSy);
        }
        this.lastSx = 1;
        this.lastSy = 1;
      }
      this.pivot = this.origPivot;
    }

    this.corner = this.corner.add(delta);
    let size = this.corner.subtract(this.pivot);
    if (event.modifiers.alt) {
      size = size.multiply(2);
    }
    let sx = 1.0;
    let sy = 1.0;
    if (Math.abs(this.origSize.x) > 0.0000001) {
      sx = size.x / this.origSize.x;
    }
    if (Math.abs(this.origSize.y) > 0.0000001) {
      sy = size.y / this.origSize.y;
    }

    const sortByPrioOrDist = (a, b) => {
      const prioDiff = priority.indexOf(a.type) - priority.indexOf(b.type);
      if (prioDiff) return prioDiff;
      return a.distance - b.distance;
    };
    const paintLayer = getLayer("isPaintingLayer");

    const doesSx = snapOn && ((this.isCorner && !event.modifiers.shift) || Math.abs(this.origSize.x) > 0.0000001);
    const doesSy = snapOn && ((this.isCorner && !event.modifiers.shift) || Math.abs(this.origSize.y) > 0.0000001);

    const scaledThreshold = threshold / paper.view.zoom;

    const canSnap = (coord) => coord.distance < scaledThreshold;

    const format = ([coordName, coord]) => ({
      type: coord.type,
      distance: (() => {
        switch (coord.type) {
          case "width": {
            return Math.abs(Math.abs(size.x) - Math.abs(coord.clamp.max - coord.clamp.min));
          }
          case "height": {
            return Math.abs(Math.abs(size.y) - Math.abs(coord.clamp.max - coord.clamp.min));
          }
          case "xcoord":
          case "itemSideVert": {
            return Math.abs(this.corner.x - coord.value);
          }
          case "ycoord":
          case "itemSideHoriz": {
            return Math.abs(this.corner.y - coord.value);
          }
          default:
            break;
        }
      })(),
      name: coordName,
      coord: coord,
    });

    const snapXCoords = createScalePoints(paper, lib, paintLayer.children, doesSx, false);

    const canSnapXCoords = Object.entries(snapXCoords).map(format).filter(canSnap).sort(sortByPrioOrDist);

    const snapYCoords = createScalePoints(paper, lib, paintLayer.children, false, doesSy);

    const canSnapYCoords = Object.entries(snapYCoords).map(format).filter(canSnap).sort(sortByPrioOrDist);

    const closestSnapX = canSnapXCoords[0];
    const closestSnapY = canSnapYCoords[0];

    const signx = sx > 0 ? 1 : -1;
    const signy = sy > 0 ? 1 : -1;
    // TODO: show correct guides
    if (closestSnapX) {
      switch (closestSnapX.type) {
        case "width": {
          const newSize = new paper.Point(
            Math.abs(closestSnapX.coord.clamp.max - closestSnapX.coord.clamp.min),
            this.corner.y
          );
          sx = newSize.x / this.origSize.x;
          break;
        }
        case "xcoord":
        case "itemSideVert": {
          const newSize = new paper.Point(closestSnapX.coord.value, this.corner.y).subtract(this.pivot);
          sx = newSize.x / this.origSize.x;
          if (event.modifiers.alt) sx *= 2;
          break;
        }
        default:
          break;
      }
    }
    if (closestSnapY) {
      switch (closestSnapY.type) {
        case "height": {
          const newSize = new paper.Point(
            this.corner.x,
            Math.abs(closestSnapY.coord.clamp.max - closestSnapY.coord.clamp.min)
          );
          sy = newSize.y / this.origSize.y;
          break;
        }
        case "ycoord":
        case "itemSideHoriz": {
          const newSize = new paper.Point(this.corner.x, closestSnapY.coord.value).subtract(this.pivot);
          sy = newSize.y / this.origSize.y;
          if (event.modifiers.alt) sy *= 2;
          break;
        }
        default:
          break;
      }
    }

    const oldSX = sx;
    const oldSY = sy;

    if (this.isCorner && !event.modifiers.shift) {
      sx = sy = Math.max(Math.abs(sx), Math.abs(sy));
      sx *= signx;
      sy *= signy;
    }

    sx = signx * Math.max(Math.abs(sx), MIN_SCALE_FACTOR);
    sy = signy * Math.max(Math.abs(sy), MIN_SCALE_FACTOR);

    this.itemGroup.scale(sx / this.lastSx, sy / this.lastSy, this.pivot);
    if (this.selectionAnchor) {
      this.selectionAnchor.scale(this.lastSx / sx, this.lastSy / sy);
    }

    removeGuides();

    if ((Math.abs(oldSX) === Math.abs(sx) && closestSnapX) || (Math.abs(oldSY) === Math.abs(sy) && closestSnapY))
      fixGuideSizes();

    if (Math.abs(oldSX) === Math.abs(sx) && closestSnapX) {
      switch (closestSnapX.type) {
        case "width": {
          const matchy = closestSnapX.coord.value;
          const selectiony = this.itemGroup.bounds.bottom;

          matchingSizeGuide.endLeft.firstSegment.point = new paper.Point(closestSnapX.coord.clamp.min, matchy);
          matchingSizeGuide.endLeft.lastSegment.point = new paper.Point(
            closestSnapX.coord.clamp.min,
            matchy + 5 / paper.view.zoom
          );
          matchingSizeGuide.endRight.firstSegment.point = new paper.Point(closestSnapX.coord.clamp.max, matchy);
          matchingSizeGuide.endRight.lastSegment.point = new paper.Point(
            closestSnapX.coord.clamp.max,
            matchy + 5 / paper.view.zoom
          );
          matchingSizeGuide.line.firstSegment.point = new paper.Point(
            closestSnapX.coord.clamp.min,
            matchy + 3 / paper.view.zoom
          );
          matchingSizeGuide.line.lastSegment.point = new paper.Point(
            closestSnapX.coord.clamp.max,
            matchy + 3 / paper.view.zoom
          );
          matchingSizeGuide.group.visible = true;
          matchingSizeGuide.group.bringToFront();

          selectionSizeGuide.endLeft.firstSegment.point = new paper.Point(
            this.itemGroup.bounds.left,
            selectiony + 2 / paper.view.zoom
          );
          selectionSizeGuide.endLeft.lastSegment.point = new paper.Point(
            this.itemGroup.bounds.left,
            selectiony + 7 / paper.view.zoom
          );
          selectionSizeGuide.endRight.firstSegment.point = new paper.Point(
            this.itemGroup.bounds.right,
            selectiony + 2 / paper.view.zoom
          );
          selectionSizeGuide.endRight.lastSegment.point = new paper.Point(
            this.itemGroup.bounds.right,
            selectiony + 7 / paper.view.zoom
          );
          selectionSizeGuide.line.firstSegment.point = new paper.Point(
            this.itemGroup.bounds.left,
            selectiony + 4.5 / paper.view.zoom
          );
          selectionSizeGuide.line.lastSegment.point = new paper.Point(
            this.itemGroup.bounds.right,
            selectiony + 4.5 / paper.view.zoom
          );
          selectionSizeGuide.group.visible = true;
          selectionSizeGuide.group.bringToFront();
          break;
        }
        case "xcoord":
        case "itemSideVert": {
          axisLineX.firstSegment.point = new paper.Point(closestSnapX.coord.value, bounds.top);
          axisLineX.lastSegment.point = new paper.Point(closestSnapX.coord.value, bounds.bottom);
          axisLineX.visible = true;
          axisLineX.bringToFront();
          break;
        }
        default:
          break;
      }
    }
    if (Math.abs(oldSY) === Math.abs(sy) && closestSnapY) {
      switch (closestSnapY.type) {
        case "height": {
          const matchx = closestSnapY.coord.value;
          const selectionx = this.itemGroup.bounds.left;

          matchingSizeGuide.endLeft.firstSegment.point = new paper.Point(matchx, closestSnapY.coord.clamp.min);
          matchingSizeGuide.endLeft.lastSegment.point = new paper.Point(
            matchx - 5 / paper.view.zoom,
            closestSnapY.coord.clamp.min
          );
          matchingSizeGuide.endRight.firstSegment.point = new paper.Point(matchx, closestSnapY.coord.clamp.max);
          matchingSizeGuide.endRight.lastSegment.point = new paper.Point(
            matchx - 5 / paper.view.zoom,
            closestSnapY.coord.clamp.max
          );
          matchingSizeGuide.line.firstSegment.point = new paper.Point(
            matchx - 3 / paper.view.zoom,
            closestSnapY.coord.clamp.min
          );
          matchingSizeGuide.line.lastSegment.point = new paper.Point(
            matchx - 3 / paper.view.zoom,
            closestSnapY.coord.clamp.max
          );
          matchingSizeGuide.group.visible = true;
          matchingSizeGuide.group.bringToFront();

          selectionSizeGuide.endLeft.firstSegment.point = new paper.Point(
            selectionx - 2 / paper.view.zoom,
            this.itemGroup.bounds.top
          );
          selectionSizeGuide.endLeft.lastSegment.point = new paper.Point(
            selectionx - 7 / paper.view.zoom,
            this.itemGroup.bounds.top
          );
          selectionSizeGuide.endRight.firstSegment.point = new paper.Point(
            selectionx - 2 / paper.view.zoom,
            this.itemGroup.bounds.bottom
          );
          selectionSizeGuide.endRight.lastSegment.point = new paper.Point(
            selectionx - 7 / paper.view.zoom,
            this.itemGroup.bounds.bottom
          );
          selectionSizeGuide.line.firstSegment.point = new paper.Point(
            selectionx - 4.5 / paper.view.zoom,
            this.itemGroup.bounds.top
          );
          selectionSizeGuide.line.lastSegment.point = new paper.Point(
            selectionx - 4.5 / paper.view.zoom,
            this.itemGroup.bounds.bottom
          );
          selectionSizeGuide.group.visible = true;
          selectionSizeGuide.group.bringToFront();
          break;
        }
        case "ycoord":
        case "itemSideHoriz": {
          axisLineY.firstSegment.point = new paper.Point(bounds.left, closestSnapY.coord.value);
          axisLineY.lastSegment.point = new paper.Point(bounds.right, closestSnapY.coord.value);
          axisLineY.visible = true;
          axisLineY.bringToFront();
          break;
        }
        default:
          break;
      }
    }

    this.lastSx = sx;
    this.lastSy = sy;
  };

  const oldMouseUp = scaleTool.constructor.prototype.onMouseUp;
  scaleTool.constructor.prototype.onMouseUp = function () {
    removeGuides();
    oldMouseUp.call(this);
  };
};
