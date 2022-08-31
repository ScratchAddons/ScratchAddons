export function loadModule(paper) {
  // https://github.com/LLK/scratch-paint/blob/2a9fb2356d961200dc849b5b0a090d33f473c0b5/src/helper/math.js

  /** The ratio of the curve length to use for the handle length to convert squares into approximately circles. */
  const HANDLE_RATIO = 0.3902628565;

  const checkPointsClose = function (startPos, eventPoint, threshold) {
    const xOff = Math.abs(startPos.x - eventPoint.x);
    const yOff = Math.abs(startPos.y - eventPoint.y);
    if (xOff < threshold && yOff < threshold) {
      return true;
    }
    return false;
  };

  const getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  };

  const getRandomBoolean = function () {
    return getRandomInt(0, 2) === 1;
  };

  // Thanks Mikko Mononen! https://github.com/memononen/stylii
  const snapDeltaToAngle = function (delta, snapAngle) {
    let angle = Math.atan2(delta.y, delta.x);
    angle = Math.round(angle / snapAngle) * snapAngle;
    const dirx = Math.cos(angle);
    const diry = Math.sin(angle);
    const d = dirx * delta.x + diry * delta.y;
    return new paper.Point(dirx * d, diry * d);
  };

  const _getDepth = function (item) {
    let temp = item;
    let depth = 0;
    while (!(temp instanceof paper.Layer)) {
      depth++;
      if (temp.parent === null) {
        // This item isn't attached to a layer, so it's not on the canvas and can't be compared.
        return null;
      }
      temp = temp.parent;
    }
    return depth;
  };

  const sortItemsByZIndex = function (a, b) {
    if (a === null || b === null) {
      return null;
    }

    // Get to the same depth in the project tree
    let tempA = a;
    let tempB = b;
    let aDepth = _getDepth(a);
    let bDepth = _getDepth(b);
    while (bDepth > aDepth) {
      tempB = tempB.parent;
      bDepth--;
    }
    while (aDepth > bDepth) {
      tempA = tempA.parent;
      aDepth--;
    }

    // Step up until they share parents. When they share parents, compare indices.
    while (tempA && tempB) {
      if (tempB === tempA) {
        return 0;
      } else if (tempB.parent === tempA.parent) {
        if (tempB.parent instanceof paper.CompoundPath) {
          // Neither is on top of the other in a compound path. Return in order of decreasing size.
          return Math.abs(tempB.area) - Math.abs(tempA.area);
        }
        return parseFloat(tempA.index) - parseFloat(tempB.index);
      }
      tempB = tempB.parent;
      tempA = tempA.parent;
    }

    // No shared hierarchy
    return null;
  };

  // Expand the size of the path by amount all around
  const expandBy = function (path, amount) {
    const center = path.position;
    let pathArea = path.area;
    for (const seg of path.segments) {
      const delta = seg.point.subtract(center).normalize().multiply(amount);
      seg.point = seg.point.add(delta);
      // If that made the path area smaller, go the other way.
      if (path.area < pathArea) seg.point = seg.point.subtract(delta.multiply(2));
      pathArea = path.area;
    }
  };

  // Do for all nested items in groups
  const _doRecursively = function (item, func) {
    if (item instanceof paper.Group) {
      for (const child of item.children) {
        _doRecursively(child, func);
      }
    } else {
      func(item);
    }
  };

  // Make item clockwise. Drill down into groups.
  const ensureClockwise = function (root) {
    _doRecursively(root, (item) => {
      if (item instanceof paper.PathItem) {
        item.clockwise = true;
      }
    });
  };

  // Scale item and its strokes by factor
  const scaleWithStrokes = function (root, factor, pivot) {
    _doRecursively(root, (item) => {
      if (item instanceof paper.PointText) {
        // Text outline size is controlled by text transform matrix, thus it's already scaled.
        return;
      }
      if (item.strokeWidth) {
        item.strokeWidth = item.strokeWidth * factor;
      }
    });
    root.scale(factor, pivot);
  };

  /**
   * Get the size and position of a square, as in if the user were holding the shift key down while drawing the shape,
   * from the point where the drag started and the point where the mouse is currently positioned. (Note: This also works
   * for shapes like circles ("square ovals"), which fill the same dimensions.)
   * @param {!paper.Point} startPos The point where the user started dragging
   * @param {!paper.Point} eventPoint The point where the user has currently dragged to
   * @return {object} Information about the size and position of how the square should be drawn
   */
  const getSquareDimensions = function (startPos, eventPoint) {
    // These variables are used for determining the relative quadrant that the shape will appear in.
    // So if you drag up and right, it'll show up above and to the right of where you started dragging, etc.
    let offsetX = eventPoint.x - startPos.x;
    let offsetY = eventPoint.y - startPos.y;

    // If the offset variables are zero, the shape ends up having zero width or height, which is bad.
    // Deal with this by forcing them to be non-zero (we arbitrarily choose 1; any non-zero value would work).
    offsetX = offsetX ? offsetX : 1;
    offsetY = offsetY ? offsetY : 1;

    // The length of the shape is the greater of the X and Y offsets.
    const offsetDistance = eventPoint.subtract(startPos).abs();
    const length = Math.max(offsetDistance.x, offsetDistance.y);

    const size = new paper.Point((length * offsetX) / Math.abs(offsetX), (length * offsetY) / Math.abs(offsetY));

    const position = startPos.add(size.multiply(0.5));

    return { size, position };
  };

  return {
    HANDLE_RATIO,
    checkPointsClose,
    ensureClockwise,
    expandBy,
    getRandomInt,
    getRandomBoolean,
    getSquareDimensions,
    scaleWithStrokes,
    snapDeltaToAngle,
    sortItemsByZIndex,
  };
}
