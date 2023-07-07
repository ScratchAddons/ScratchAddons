import { snapFrom, snapTo } from "./state.js";

export default function createSnapPoints(paper, selectionBounds, lib, objects) {
  const {
    view: { CENTER, ART_BOARD_BOUNDS },
  } = lib;
  const fromPoints = {
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
    ...(snapFrom.boxEdgeMids
      ? {
          left: new paper.Point(selectionBounds.left, selectionBounds.center.y),
          right: new paper.Point(selectionBounds.right, selectionBounds.center.y),
          top: new paper.Point(selectionBounds.center.x, selectionBounds.top),
          bottom: new paper.Point(selectionBounds.center.x, selectionBounds.bottom),
        }
      : {}),
  };

  const toPoints = {
    ...(snapTo.pageCenter
      ? {
          bounds_c: {
            type: "point",
            value: CENTER,
          },
        }
      : {}),
    ...(snapTo.pageAxes
      ? {
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
          objects
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
          objects
            .filter((item) => !item.selected)
            .map((item) => [
              [
                `item_${item.id}_c`,
                {
                  type: "point",
                  value: item.bounds.center,
                },
              ],
            ])
            .flat(1)
        )
      : {}),
    ...(snapTo.objectMidlines
      ? Object.fromEntries(
          objects
            .filter((item) => !item.selected)
            .map((item) => [
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
          objects
            .filter((item) => !(item.selected || item.data.isHelperItem))
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

  return {
    from: fromPoints,
    to: toPoints,
  };
}
