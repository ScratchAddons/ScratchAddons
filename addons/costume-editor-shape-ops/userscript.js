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

  function decomposeCompoundPath(path) {
    const childIndex = path.parent.children.indexOf(path);
    const items = path.parent.insertChildren(childIndex, path.children);
    path.remove();
    return items || [];
  }

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

        newItem.insertBelow(item1);
        let compoundPathResults = [newItem];
        if (isCompoundPath(newItem)) compoundPathResults = decomposeCompoundPath(newItem);
        results.push(...compoundPathResults);
      });

      selectedItems.forEach((item) => item.remove());

      // kinda ugly solution to remove duplicate objects
      /*for (const result of results) {
        if (!result.parent) continue;
        for (const result2 of results) {
          if (!result2.parent) continue;
          if (result === result2) continue;
          if (result && result2 && result?.compare(result2)) {
            result2.remove();
          }
        }
      }*/

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

        let compoundPathResults = [result];
        if (isCompoundPath(result)) compoundPathResults = decomposeCompoundPath(result);

        results.push(...compoundPathResults);
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
        if (item.children) {
          item.children.forEach(processItem);
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
      if (!((specificOperation === "subtract" || specificOperation === "intersect") && doSelections)) {
        results.forEach((item) => {
          item.insertBelow(last);
          if (isCompoundPath(item)) {
            decomposeCompoundPath(item).forEach((i) => i.copyAttributes(item, true));
          }
        });
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

  let lastSelect;
  addon.tab.redux.addEventListener("statechanged", ({ detail: { action } }) => {
    if (lastSelect && action.type === "scratch-paint/formats/CHANGE_FORMAT") {
      if (action.format === "VECTOR") {
        lastSelect.style.display = "";
      } else {
        lastSelect.style.display = "none";
      }
    }
  });
  while (true) {
    const modeToolsEl = await addon.tab.waitForElement("[class*='paint-editor_mod-mode-tools_']", {
      markAsSeen: true,
      reduxEvents: [
        "scratch-gui/navigation/ACTIVATE_TAB",
        "scratch-gui/mode/SET_PLAYER",
        "fontsLoaded/SET_FONTS_LOADED",
        "scratch-gui/locales/SELECT_LOCALE",
        "scratch-gui/targets/UPDATE_TARGET_LIST",
        "scratch-paint/formats/CHANGE_FORMAT",
      ],
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
    });

    const select = document.createElement("select");
    select.style.display = addon.tab.redux.state.scratchPaint.format === "VECTOR" ? "" : "none";
    lastSelect = select;
    function addSelectOption(value, callback = null, header = false) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = msg(value);
      if (!header) option.title = msg(value + "-title");
      option.disabled = header;
      option.selected = header;
      if (callback) {
        select.addEventListener("change", () => {
          if (select.value === value) {
            callback();
            select.value = "header";
          }
        });
      }
      select.appendChild(option);
    }
    addon.tab.displayNoneWhileDisabled(select);

    addSelectOption("header", null, true);
    addSelectOption("merge", handleMergeShape);
    addSelectOption("mask", handleMaskShape);
    addSelectOption("subtract", handleSubtractShape);
    addSelectOption("exclude", handleExcludeShape);
    addSelectOption("fracture", handleFractureShape);
    addSelectOption("cut", handleCutShape);

    modeToolsEl.appendChild(select);
  }
}
