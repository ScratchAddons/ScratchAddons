import { snapFrom, snapTo } from "./state.js";

export default function createScalePoints(paper, lib, objects, sx, sy) {
  const {
    view: { CENTER, ART_BOARD_BOUNDS },
  } = lib;

  const toPoints = {
    ...(snapTo.pageAxes
      ? {
          ...(sx
            ? {
                bounds_cx: {
                  type: "xcoord",
                  value: CENTER.x,
                },
              }
            : {}),
          ...(sy
            ? {
                bounds_cy: {
                  type: "ycoord",
                  value: CENTER.y,
                },
              }
            : {}),
        }
      : {}),
    ...(snapTo.pageEdges
      ? {
          ...(sx
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
              }
            : {}),
          ...(sy
            ? {
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
              }
            : {}),
          ...(sx
            ? {
                bounds_w: {
                  type: "width",
                  value: CENTER.y,
                  clamp: {
                    min: ART_BOARD_BOUNDS.left,
                    max: ART_BOARD_BOUNDS.right,
                  },
                },
              }
            : {}),
          ...(sy
            ? {
                bounds_h: {
                  type: "height",
                  value: CENTER.x,
                  clamp: {
                    min: ART_BOARD_BOUNDS.bottom,
                    max: ART_BOARD_BOUNDS.top,
                  },
                },
              }
            : {}),
        }
      : {}),
    ...(snapTo.objectEdges
      ? Object.fromEntries(
          objects
            .filter((item) => !(item.selected || item.data.isHelperItem || item.locked || item.guide))
            .map((item) =>
              [
                sx && [
                  `item_${item.id}_r`,
                  {
                    type: "xcoord",
                    value: item.bounds.right,
                  },
                ],
                sx && [
                  `item_${item.id}_l`,
                  {
                    type: "xcoord",
                    value: item.bounds.left,
                  },
                ],
                sy && [
                  `item_${item.id}_t`,
                  {
                    type: "ycoord",
                    value: item.bounds.top,
                  },
                ],
                sy && [
                  `item_${item.id}_b`,
                  {
                    type: "ycoord",
                    value: item.bounds.bottom,
                  },
                ],
                sx && [
                  `item_${item.id}_w`,
                  {
                    type: "width",
                    value: item.bounds.bottom,
                    clamp: {
                      min: item.bounds.left,
                      max: item.bounds.right,
                    },
                  },
                ],
                sy && [
                  `item_${item.id}_h`,
                  {
                    type: "height",
                    value: item.bounds.left,
                    clamp: {
                      min: item.bounds.bottom,
                      max: item.bounds.top,
                    },
                  },
                ],
              ].filter(Boolean)
            )
            .flat(1)
        )
      : {}),
    ...(snapTo.objectMidlines
      ? Object.fromEntries(
          objects
            .filter((item) => !(item.selected || item.data.isHelperItem || item.locked || item.guide))
            .map((item) =>
              [
                sx && [
                  `item_${item.id}_cx`,
                  {
                    type: "xcoord",
                    value: item.bounds.center.x,
                  },
                ],
                sy && [
                  `item_${item.id}_cy`,
                  {
                    type: "ycoord",
                    value: item.bounds.center.y,
                  },
                ],
              ].filter(Boolean)
            )
            .flat(1)
        )
      : {}),
  };

  return toPoints;
}
