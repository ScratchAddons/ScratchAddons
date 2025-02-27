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
  function recursiveDecompose(item, dryRun = false) {
    if (Array.isArray(item)) {
      const newArray = [];
      for (const child of item) {
        newArray.push(...recursiveDecompose(child, dryRun));
      }
      return newArray;
    }
    if (!item || !item.children) return [item];
    const children = item.children;
    if (!dryRun) decomposeCompoundPath(item);
    return children.map(() => recursiveDecompose(child, dryRun));
  }

  // Some of this code was originally written by JeremyGamer13 for PenguinMod,
  // and further modified by CST1229
  // https://github.com/CST1229/scratch-paint/blob/0283b94a479d58af9500af0317f6f1bc0f193f78/src/containers/mode-tools.jsx#L191-L347
  function handleMergeShape(specificOperation, doSelections) {
    // if it breaks, it's probably better to throw a debuggable error in the console rather than silently failing
    const modeToolsEl = document.querySelector("[class*='paint-editor_mod-mode-tools_']");
    const internalInstanceKey = addon.tab.traps.getInternalKey(modeToolsEl);
    let modeToolsInst = modeToolsEl[internalInstanceKey];
    while (!(modeToolsInst?.stateNode?.props?.setSelectedItems && modeToolsInst?.stateNode?.props?.onUpdateImage) && modeToolsInst) {
      modeToolsInst = modeToolsInst.child;
    }
    const modeTools = modeToolsInst.stateNode;

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

    let selectedItems = getSelectedRootItems();
    if (recursiveDecompose(selectedItems, true).filter((item) => item.unite).length < 2) {
      // If nothing or not enough items are selected,
      // we probably shouldnt select and merge everything
      return;
    }
    const results = [];
    selectedItems = recursiveDecompose(selectedItems).filter((item) => item.unite);

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
      let last = selectedItems[selectedItems.length - 1];
      if (specificOperation === "exclude") {
        // intersect all selected items to use as a subtract mask
        last = selectedItems[0];
        for (let i = 1; i < selectedItems.length; i++) {
          last = last.intersect(selectedItems[i], { insert: false });
        }
        specificOperation = "subtract";
      }
      if (!last.unite) return;
      const alternateBehavior = (specificOperation === "subtract" || specificOperation === "intersect") && doSelections;

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

        if (alternateBehavior) {
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
      if (!alternateBehavior) {
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
      results.forEach((result) => setItemSelection(result, true));
    }
    modeTools.props.onUpdateImage();
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

  const dashedBorder = addon.tab.scratchClass("mode-tools_mod-dashed-border");

  let lastSelect, lastSelectContainer, lastPrevButton;
  document.addEventListener("pointerdown", function (e) {
    if (lastSelect && lastSelectContainer && !lastSelectContainer.contains(e.target)) {
      lastSelectContainer.classList.remove("shown");
    }
  });
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener(
    "statechanged",
    ({
      detail: {
        action: { type },
      },
    }) => {
      if (!lastSelect) return;
      if (type === "scratch-paint/formats/CHANGE_FORMAT" || type === "scratch-paint/modes/CHANGE_MODE") {
        updateSelectVisibility();
      } else if (type === "scratch-paint/select/CHANGE_SELECTED_ITEMS") {
        updateSelectDisabled();
      }
    }
  );
  addon.self.addEventListener("disabled", () => {
    if (lastSelect) {
      updateSelectVisibility();
    }
  });
  addon.self.addEventListener("reenabled", () => {
    if (lastSelect) {
      updateSelectVisibility();
    }
  });

  function updateSelectVisibility() {
    // Only show the dropdown in vector select mode
    if (addon.tab.redux.state.scratchPaint.mode === "SELECT" && !addon.self.disabled) {
      lastSelect.style.display = "";
      lastPrevButton.classList.add(dashedBorder);
    } else {
      lastSelect.style.display = "none";
      lastSelectContainer.classList.remove("shown");
      lastPrevButton.classList.remove(dashedBorder);
    }
  }
  function updateSelectDisabled() {
    // Shape operations can't be used with less than 2 selected items anyways
    lastSelect.disabled = addon.tab.redux.state.scratchPaint.selectedItems.length < 2;
    if (lastSelect.disabled) {
      lastSelect.title = msg("button-disabled");
    } else {
      lastSelect.title = "";
    }
  }

  while (true) {
    const modeToolsEl = await addon.tab.waitForElement("[class*='paint-editor_mod-mode-tools_']", {
      markAsSeen: true,
      reduxEvents: [
        "scratch-gui/navigation/ACTIVATE_TAB",
        "scratch-gui/mode/SET_PLAYER",
        "fontsLoaded/SET_FONTS_LOADED",
        "scratch-gui/locales/SELECT_LOCALE",
        "scratch-gui/targets/UPDATE_TARGET_LIST",
      ],
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
    });

    const selectContainer = document.createElement("div");
    selectContainer.className = "sa-shape-ops-container";
    lastSelectContainer = selectContainer;
    addon.tab.displayNoneWhileDisabled(selectContainer);

    const selectOptions = document.createElement("div");
    selectOptions.className = "sa-shape-ops-options Popover-body";

    const select = document.createElement("button");
    select.className = "sa-shape-ops-dropdown " + addon.tab.scratchClass("dropdown_dropdown");
    select.textContent = msg("header");
    select.addEventListener("click", function () {
      lastSelectContainer.classList.toggle("shown");
    });
    lastSelect = select;
    updateSelectDisabled();

    const dropdownArrow = document.createElement("img");
    dropdownArrow.src =
      "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjhweCIgaGVpZ2h0PSI1cHgiIHZpZXdCb3g9IjAgMCA4IDUiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDQzLjIgKDM5MDY5KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5kcm9wZG93bi1jYXJldDwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJkcm9wZG93bi1jYXJldCIgZmlsbD0iIzg1NUNENiI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik00LDUgQzMuNzI1MjA3MDgsNSAzLjQ1MTYzMDA2LDQuODk2OTUwNDUgMy4yNDEyNzk3Myw0LjY4OTY1MzExIEwwLjMxNDYxMzU3MiwxLjgwNjY2MjI3IEMtMC4xMDQ4NzExOTEsMS4zOTMyNjU4MyAtMC4xMDQ4NzExOTEsMC43MjQ2NDIwMjMgMC4zMTQ2MTM1NzIsMC4zMTAwNDczMzEgQzAuNzMyODgyNDM4LC0wLjEwMzM0OTExIDcuMjY3MTE3NTYsLTAuMTAzMzQ5MTEgNy42ODUzODY0MywwLjMxMDA0NzMzMSBDOC4xMDQ4NzExOSwwLjcyMzQ0Mzc3MiA4LjEwNDg3MTE5LDEuMzkzMjY1ODMgNy42ODUzODY0MywxLjgwNjY2MjI3IEw0Ljc1OTkzNjE3LDQuNjg5NjUzMTEgQzQuNTQ5NTg1ODMsNC44OTY5NTA0NSA0LjI3NjAwODgyLDUgNCw1Ij48L3BhdGg+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4K";
    dropdownArrow.className = "sa-shape-ops-dropdown-arrow " + addon.tab.scratchClass("dropdown_dropdown-icon");
    dropdownArrow.draggable = false;
    select.appendChild(dropdownArrow);

    function addSelectOption(value, callback) {
      const option = document.createElement("button");
      option.className = `sa-shape-ops-option ${addon.tab.scratchClass("button_button")} ${addon.tab.scratchClass(
        "fixed-tools_mod-menu-item"
      )}`;
      option.title = msg(value + "-title");
      option.addEventListener("click", function () {
        callback();
        lastSelectContainer.classList.remove("shown");
      });

      const img = document.createElement("img");
      img.src = `${addon.self.dir}/assets/${value}.svg`;
      img.className = addon.tab.scratchClass("fixed-tools_menu-item-icon");
      img.draggable = false;

      option.appendChild(img);

      const text = document.createElement("span");
      text.textContent = msg(value);
      option.appendChild(text);
      selectOptions.appendChild(option);
    }

    addSelectOption("merge", handleMergeShape);
    addSelectOption("mask", handleMaskShape);
    addSelectOption("subtract", handleSubtractShape);
    addSelectOption("exclude", handleExcludeShape);
    addSelectOption("fracture", handleFractureShape);
    addSelectOption("cut", handleCutShape);

    selectContainer.appendChild(selectOptions);
    selectContainer.appendChild(select);
    modeToolsEl.appendChild(selectContainer);

    lastPrevButton = selectContainer.previousElementSibling;
    updateSelectVisibility();
  }
}
