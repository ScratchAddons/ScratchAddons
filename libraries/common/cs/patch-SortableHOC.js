// Helper functions for patching SortableHOC
// Made by GarboMuffin
// https://github.com/scratchfoundation/scratch-gui/blob/develop/src/lib/sortable-hoc.jsx

let reactInternalKey;
export const TYPE_ASSETS = 2;

export function setReactInternalKey(value) {
  reactInternalKey = value;
}

export function getReactInternalKey() {
  return reactInternalKey;
}

export const getSortableHOCFromElement = (el) => {
  let reactInternalInstance;
  const nearestSpriteSelector = el.closest("[class*='sprite-selector_sprite-selector']");
  if (nearestSpriteSelector) {
    reactInternalInstance = nearestSpriteSelector[reactInternalKey].child.sibling;
  }
  const nearestAssetPanelWrapper = el.closest('[class*="asset-panel_wrapper"]');
  if (nearestAssetPanelWrapper) {
    reactInternalInstance = nearestAssetPanelWrapper[reactInternalKey];
  }
  if (reactInternalInstance) {
    while (!isSortableHOC(reactInternalInstance.stateNode)) {
      reactInternalInstance = reactInternalInstance.child;
    }
    return reactInternalInstance.stateNode;
  }
  throw new Error("cannot find SortableHOC");
};

const isSortableHOC = (sortableHOCInstance) => {
  try {
    const SortableHOC = sortableHOCInstance.constructor;
    return (
      Array.isArray(sortableHOCInstance.props.items) &&
      (typeof sortableHOCInstance.props.selectedId === "string" ||
        typeof sortableHOCInstance.props.selectedItemIndex === "number") &&
      typeof sortableHOCInstance.containerBox !== "undefined" &&
      typeof SortableHOC.prototype.handleAddSortable === "function" &&
      typeof SortableHOC.prototype.handleRemoveSortable === "function" &&
      typeof SortableHOC.prototype.setRef === "function"
    );
  } catch {
    return false;
  }
};

export const verifySortableHOC = (sortableHOCInstance, ignoreReactMethods) => {
  const SortableHOC = sortableHOCInstance.constructor;
  if (
    isSortableHOC(sortableHOCInstance) &&
    ((typeof SortableHOC.prototype.componentDidMount === "undefined" &&
      typeof SortableHOC.prototype.componentDidUpdate === "undefined") ||
      ignoreReactMethods == true)
  )
    return;
  throw new Error("Can not comprehend SortableHOC");
};
