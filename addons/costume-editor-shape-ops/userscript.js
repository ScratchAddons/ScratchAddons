export default async function ({ addon, msg, console }) {
  const paper = await addon.tab.traps.getPaper();

  // https://github.com/scratchfoundation/scratch-paint/blob/develop/src/helper/selection.jsx
  const getAllRootItems = function (includeGuides) {
    includeGuides = includeGuides || false;
    const allItems = [];
    for (const layer of paper.project.layers) {
      for (const child of layer.children) {
        // don't give guides back
        if (!includeGuides && child.guide) {
          continue;
        }
        allItems.push(child);
      }
    }
    return allItems;
  };
  const getAllSelectableRootItems = function () {
    const allItems = getAllRootItems();
    const selectables = [];
    for (let i = 0; i < allItems.length; i++) {
      if (allItems[i].data && !allItems[i].data.isHelperItem) {
        selectables.push(allItems[i]);
      }
    }
    return selectables;
  };
  const getSelectedRootItems = function () {
    const allItems = getAllSelectableRootItems();
    const items = [];

    for (const item of allItems) {
      if (item.selected) {
        items.push(item);
      } else if (item instanceof paper.CompoundPath) {
        // Consider a compound path selected if any of its paths are selected
        for (const child of item.children) {
          if (child.selected) {
            items.push(item);
            break;
          }
        }
      }
    }

    // sort items by index (0 at bottom)
    items.sort((a, b) => parseFloat(a.index) - parseFloat(b.index));
    return items;
  };

  // https://github.com/scratchfoundation/scratch-paint/blob/develop/src/helper/item.js
  const isGroupItem = function (item) {
    return item && item.className && item.className === "Group";
  };
  // https://github.com/scratchfoundation/scratch-paint/blob/develop/src/helper/group.js
  const isGroup = function (item) {
    return isGroupItem(item);
  };
  const getItemsGroup = function (item) {
    const itemParent = item.parent;

    if (isGroup(itemParent)) {
      return itemParent;
    }
    return null;
  };
  // https://github.com/scratchfoundation/scratch-paint/blob/develop/src/helper/compound-path.js
  const isCompoundPath = function (item) {
    return item && item.className === "CompoundPath";
  };
  const getItemsCompoundPath = function (item) {
    const itemParent = item.parent;

    if (isCompoundPath(itemParent)) {
      return itemParent;
    }
    return null;
  };
  const _setGroupSelection = function (root, selected, fullySelected) {
    root.fullySelected = fullySelected;
    root.selected = selected;
    // select children of compound-path or group
    if (isCompoundPath(root) || isGroup(root)) {
      const children = root.children;
      if (children) {
        for (const child of children) {
          if (isGroup(child)) {
            _setGroupSelection(child, selected, fullySelected);
          } else {
            child.fullySelected = fullySelected;
            child.selected = selected;
          }
        }
      }
    }
  };

  const setItemSelection = function (item, state, fullySelected) {
    const parentGroup = getItemsGroup(item);
    const itemsCompoundPath = getItemsCompoundPath(item);

    // if selection is in a group, select group
    if (parentGroup) {
      // do it recursive
      setItemSelection(parentGroup, state, fullySelected);
    } else if (itemsCompoundPath) {
      _setGroupSelection(itemsCompoundPath, state, fullySelected);
    } else {
      if (item.data && item.data.noSelect) {
        return;
      }
      _setGroupSelection(item, state, fullySelected);
    }
  };

  // Some of this code was originally written by JeremyGamer13 for PenguinMod,
  // and further modified by CST1229
  // https://github.com/CST1229/scratch-paint/blob/0283b94a479d58af9500af0317f6f1bc0f193f78/src/containers/mode-tools.jsx#L191-L347
  function handleMergeShape(specificOperation, doSelections) {
    const modeToolsEl = document.querySelector("[class*='paint-editor_mod-mode-tools_']");
    if (!modeToolsEl) return;
    const internalInstanceKey = Object.keys(modeToolsEl).find((key) => key.startsWith("__reactInternalInstance$"));
    if (!internalInstanceKey) return;
    const modeTools = modeToolsEl[internalInstanceKey]?.child?.child?.child?.child?.stateNode;
    if (!modeTools) return;

    if (specificOperation === "fracture") {
      const selectedItems = getSelectedRootItems();

      const results = [];

      selectedItems.forEach((item1) => {
        let newItem = item1;
        for (const item2 of selectedItems) {
          if (item2 === item1) continue;
          newItem = newItem.divide(item2, { insert: false });
        }
        results.push(newItem);
        newItem.insertBelow(item1);
      });

      selectedItems.forEach((item) => item.remove());

      // kinda ugly solution to remove duplicate objects
      const processed = new Set();
      for (const result of selectedItems) {
        for (const result2 of selectedItems) {
          if (result === result2) continue;
          if (result.position.equals(result2.position)) {
            if (!processed.has(result) && !processed.has(result2)) {
              result2.remove();
              processed.add(result);
              processed.add(result2);
            }
          }
        }
      }

      modeTools.props.setSelectedItems([]);
      results.forEach((item) => setItemSelection(item, true));

      modeTools.props.onUpdateImage();
      return;
    }

    const selectedItems = getSelectedRootItems();
    if (selectedItems.length < 2) {
      // If nothing or not enough items are selected,
      // we probably shouldnt select and merge everything
      return;
    }
    const results = [];

    // unite the shapes together, removing the original
    if (specificOperation === "divide") {
      const last = selectedItems[selectedItems.length - 1];
      if (!last.unite) return;
      const lastClone = last.clone();
      selectedItems.forEach((item) => {
        if (!item.unite) return;
        if (item === last) {
          return;
        }
        const result = item.divide(last);
        result.insertBelow(item);
        results.push(result);
      });
      results.push(lastClone);

      selectedItems.forEach((item) => item.remove());
      results.forEach((result) => setItemSelection(result, true));
      modeTools.props.onUpdateImage();
      return;
    } else if (typeof specificOperation === "string") {
      const last = selectedItems[selectedItems.length - 1];
      if (!last.unite) return;

      let result = null;
      const processItem = function (item) {
        if (item === last) {
          return;
        }
        if (item._children) {
          item._children.forEach(processItem);
          return;
        }
        if (!item.unite) return;
        if (!result) result = item;

        if ((specificOperation === "subtract" || specificOperation === "intersect") && doSelections) {
          const newItem = item[specificOperation](last);
          results.push(newItem);
          newItem.insertBelow(item);
        } else {
          result = item[specificOperation](last, { insert: false });
        }
        item.remove();
      };
      selectedItems.forEach(processItem);

      if (!result) return;

      if (results) {
        results.push(result);
      }
      if (specificOperation !== "subtract" && specificOperation !== "intersect" && doSelections) {
        results.forEach((item) => item.insertBelow(last));
      }
      last.remove();
    } else {
      // here, last is used only for placing the items
      const last = selectedItems[selectedItems.length - 1];

      const usedItems = [];

      let result = null;
      const processItem = function (item) {
        if (item._children) {
          item._children.forEach(processItem);
          return;
        }
        if (!item.unite) return;
        if (result) {
          result = result.unite(item, { insert: false });
        } else {
          result = item;
        }
        usedItems.push(item);
      };
      selectedItems.forEach(processItem);

      if (!result) return;

      results.push(result);
      result.insertBelow(last);

      usedItems.forEach((item) => item.remove());
    }
    if (doSelections) {
      selectedItems.forEach((item) => item.remove());
      // modeTools.props.setSelectedItems([]);
      results.forEach((result) => setItemSelection(result, true));
      modeTools.props.onUpdateImage();
    }
    return results;
  }

  function handleMaskShape() {
    handleMergeShape("intersect", true);
  }
  function handleSubtractShape() {
    handleMergeShape("subtract", true);
  }
  function handleExcludeShape() {
    handleMergeShape("exclude", true);
  }
  function handleFractureShape() {
    handleMergeShape("fracture", true);
  }
  function handleCutShape() {
    handleMergeShape("divide", true);
  }
  window.s_merge = handleMergeShape;
  window.s_mask = handleMaskShape;
  window.s_subtract = handleSubtractShape;
  window.s_exclude = handleExcludeShape;
  window.s_fracture = handleFractureShape;
  window.s_cut = handleCutShape;
}
