export default async function ({ addon, global, console, msg }) {
  const REACT_INTERNAL_PREFIX = "__reactInternalInstance$";
  const ID_PREFIX = "sa_";
  const ID_FOLDER_PREFIX = `${ID_PREFIX}folder_folder_`;
  const ID_BACK = `${ID_PREFIX}folder_back`;

  const SVG_NS = "http://www.w3.org/2000/svg";

  const TYPE_SPRITES = 1;
  const TYPE_ASSETS = 2;

  // We run too early, will be set later
  let vm;

  let reactInternalKey;

  let currentSpriteFolder;
  let currentSpriteItems;
  let currentAssetItems;

  /**
   * getFolderFromName("B") === null
   * getFolderFromName("A/b") === "A"
   */
  const getFolderFromName = (name) => {
    const idx = name.indexOf("/");
    if (idx === -1) {
      return null;
    }
    return name.substr(0, idx);
  };

  /**
   * getNameWithoutFolder("B") === "B"
   * getNameWithoutFolder("A/b") === "b"
   */
  const getNameWithoutFolder = (name) => {
    const idx = name.indexOf("/");
    if (idx === -1) {
      return name;
    }
    return name.substr(idx + 1);
  };

  /**
   * setFolderOfName("B", "y") === "y/B"
   * setFolderOfName("c/B", "y") === "y/B"
   * setFolderOfName("B", null) === "B"
   * setFolderOfName("c/B", null) === "B"
   */
  const setFolderOfName = (name, folder) => {
    const basename = getNameWithoutFolder(name);
    if (folder) {
      return `${folder}/${basename}`;
    }
    return basename;
  };

  const getSortableHOCFromElement = (el) => {
    const nearestSpriteSelector = el.closest("[class*='sprite-selector_sprite-selector']");
    if (nearestSpriteSelector) {
      return nearestSpriteSelector[reactInternalKey].child.sibling.child.stateNode;
    }
    const nearestAssetPanelWrapper = el.closest('[class*="asset-panel_wrapper"]');
    if (nearestAssetPanelWrapper) {
      return nearestAssetPanelWrapper[reactInternalKey].child.child.stateNode;
    }
    throw new Error("cannot find SortableHOC");
  };

  const getItemData = (item) => {
    if (item && item.name && typeof item.name === "object") {
      return item.name;
    }
    return null;
  };

  let folderColorStylesheet = null;
  const folderColors = Object.create(null);
  const getFolderColorClass = (folderName) => {
    const hashCode = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash | 0;
      }
      return hash;
    };

    if (!folderColors[folderName]) {
      if (!folderColorStylesheet) {
        folderColorStylesheet = document.createElement('style');
        document.head.appendChild(folderColorStylesheet);
      }
      // Every folder needs a random-ish color, but it should also stay consistent between visits.
      const hash = hashCode(folderName);
      const color = `hsla(${(hash & 0xff) / 0xff * 360}deg, 100%, 85%, 0.5)`;
      const id = Object.keys(folderColors).length;
      const className = `sa-folders-color-${id}`;
      folderColors[folderName] = className;
      folderColorStylesheet.textContent += `.${className} { background-color: ${color}; }\n`;
    }
    return folderColors[folderName];
  };

  const patchSortableHOC = (SortableHOC, type) => {
    // SortableHOC should be: https://github.com/LLK/scratch-gui/blob/29d9851778febe4e69fa5111bf7559160611e366/src/lib/sortable-hoc.jsx#L8

    const PREVIEW_SIZE = 64;
    const PREVIEW_POSITIONS = [
      // x, y
      [0, 0],
      [PREVIEW_SIZE / 2, 0],
      [0, PREVIEW_SIZE / 2],
      [PREVIEW_SIZE / 2, PREVIEW_SIZE / 2],
    ];

    const createFolderPreview = (items) => {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("width", PREVIEW_SIZE);
      svg.setAttribute("height", PREVIEW_SIZE);
      for (let i = 0; i < Math.min(PREVIEW_POSITIONS.length, items.length); i++) {
        const item = items[i];
        const image = document.createElementNS(SVG_NS, "image");
        image.setAttribute("width", PREVIEW_SIZE / 2);
        image.setAttribute("height", PREVIEW_SIZE / 2);
        image.setAttribute("x", PREVIEW_POSITIONS[i][0]);
        image.setAttribute("y", PREVIEW_POSITIONS[i][1]);
        if (item.asset) {
          image.setAttribute("href", item.asset.encodeDataURI());
        } else if (item.costume && item.costume.asset) {
          image.setAttribute("href", item.costume.asset.encodeDataURI());
        }
        svg.appendChild(image);
      }
      return "data:image/svg+xml;," + new XMLSerializer().serializeToString(svg);
    };

    const getFolderPreviewAssetId = (items) => {
      let id = "sa_folder_preview||";
      for (let i = 0; i < Math.min(PREVIEW_POSITIONS.length, items.length); i++) {
        const item = items[i];
        if (item.asset) {
          id += item.asset.assetId;
        } else if (item.costume && item.costume.asset) {
          id += item.costume.asset.assetId;
        }
        id += "||";
      }
      return id;
    };

    const processItems = (openFolders, props) => {
      const items = [];
      const result = {
        items,
      };

      // Do not use {}, otherwise folders named after Object.prototype members will not work
      const folderItems = Object.create(null);
      const folderIndexes = Object.create(null);

      for (let i = 0; i < props.items.length; i++) {
        const item = props.items[i];
        const itemFolderName = getFolderFromName(item.name);
        const itemData = {
          realName: item.name,
        };
        const newItem = {
          name: itemData,
        };
        let itemVisible = true;

        if (type === TYPE_SPRITES) {
          newItem.costume = item.costume;
          newItem.id = item.id;
        } else if (type === TYPE_ASSETS) {
          itemData.realIndex = i;
          newItem.asset = item.asset;
        }

        if (itemFolderName === null) {
          items.push(newItem);
        } else {
          const isOpen = openFolders.indexOf(itemFolderName) !== -1;
          if (!folderItems[itemFolderName]) {
            const folderData = {
              folder: itemFolderName,
              folderOpen: isOpen,
            };
            const folderItem = {
              items: [],
              name: folderData,
            };
            const folderAsset = {
              // We don't know these when the folder item is created
              get assetId() {
                return getFolderPreviewAssetId(folderItem.items);
              },
              encodeDataURI() {
                return createFolderPreview(folderItem.items);
              },
            };
            if (type === TYPE_SPRITES) {
              folderItem.costume = {
                asset: folderAsset,
              };
            } else {
              folderItem.asset = folderAsset;
            }
            folderItems[itemFolderName] = folderItem;
            folderIndexes[itemFolderName] = items.length;
            items.push(folderItem);
          }

          itemData.realName = getNameWithoutFolder(itemData.realName);
          itemData.inFolder = itemFolderName;
          folderItems[itemFolderName].items.push(newItem);
          if (isOpen) {
            const index = ++folderIndexes[itemFolderName];
            items.splice(index, 0, newItem);
          } else {
            itemVisible = false;
          }
        }

        if (type === TYPE_ASSETS) {
          const isSelected = props.selectedItemIndex === i;
          if (isSelected) {
            if (itemVisible) {
              result.selectedItemIndex = items.length - 1;
            } else {
              result.selectedItemIndex = -1;
            }
          }
        }
      }

      return result;
    };

    SortableHOC.prototype.saInitialSetup = function () {
      let folders = [];
      if (type === TYPE_SPRITES) {
        const target = vm.runtime.getTargetById(this.props.selectedId);
        if (target && target.sprite && target.isSprite()) {
          folders = [getFolderFromName(target.sprite.name)];
        }
      }
      this.setState({
        folders,
      });
    };

    SortableHOC.prototype.componentDidMount = function () {
      currentSpriteFolder = null;
    };

    SortableHOC.prototype.componentDidUpdate = function (prevProps, prevState) {
      // When the selected sprite has changed, open its folder.
      if (type === TYPE_SPRITES) {
        if (prevProps.selectedId !== this.props.selectedId) {
          const oldTarget = vm.runtime.getTargetById(prevProps.selectedId);
          const newTarget = vm.runtime.getTargetById(this.props.selectedId);
          if (
            oldTarget &&
            newTarget &&
            oldTarget.sprite &&
            newTarget.sprite &&
            newTarget.isSprite() // ignore switching to stage
          ) {
            const oldFolder = getFolderFromName(oldTarget.sprite.name);
            const newFolder = getFolderFromName(newTarget.sprite.name);
            if (oldFolder !== newFolder && !this.state.folders.includes(newFolder)) {
              this.setState((prevState) => ({
                folders: [...prevState.folders, newFolder],
              }));
            }
          }
        }
      }
    };

    const originalSortableHOCRender = SortableHOC.prototype.render;
    SortableHOC.prototype.render = function () {
      const originalItems = this.props.items;
      Object.assign(this.props, processItems(this.state.folders, this.props));
      if (type === TYPE_SPRITES) {
        currentSpriteItems = this.props.items;
      } else if (type === TYPE_ASSETS) {
        currentAssetItems = this.props.items;
      }
      const result = originalSortableHOCRender.call(this);
      this.props.items = originalItems;
      return result;
    };
  };

  const patchSpriteSelectorItem = (SpriteSelectorItem) => {
    // SpriteSelectorItem should be: https://github.com/LLK/scratch-gui/blob/29d9851778febe4e69fa5111bf7559160611e366/src/containers/sprite-selector-item.jsx#L16

    const toggleFolder = (component, folder) => {
      const sortableHOCInstance = getSortableHOCFromElement(component.ref);
      sortableHOCInstance.setState((prevState) => {
        const existingFolders = prevState.folders;
        if (existingFolders.includes(folder)) {
          return {
            folders: existingFolders.filter((i) => i !== folder),
          };
        } else {
          return {
            folders: [...existingFolders, folder],
          };
        }
      });
    };

    const originalSpriteSelectorItemHandleClick = SpriteSelectorItem.prototype.handleClick;
    SpriteSelectorItem.prototype.handleClick = function (e) {
      const itemData = getItemData(this.props);
      if (itemData) {
        if (typeof itemData.folder === "string") {
          e.preventDefault();
          toggleFolder(this, itemData.folder);
          return;
        }
        if (typeof itemData.realIndex === "number") {
          e.preventDefault();
          if (this.props.onClick) {
            this.props.onClick(itemData.realIndex);
          }
          return;
        }
      }
      return originalSpriteSelectorItemHandleClick.call(this, e);
    };

    const originalRender = SpriteSelectorItem.prototype.render;
    SpriteSelectorItem.prototype.render = function () {
      const itemData = getItemData(this.props);
      if (itemData) {
        const originalProps = this.props;
        this.props = {
          ...this.props,
        };

        if (typeof itemData.realName === "string") {
          this.props.name = itemData.realName;
        }
        if (typeof itemData.realIndex === "number") {
          // Convert 0-indexed to 1-indexed
          this.props.number = itemData.realIndex + 1;
        }
        if (typeof itemData.folder === "string") {
          this.props.name = itemData.folder;
          if (itemData.folderOpen) {
            this.props.details = msg("open-folder");
          } else {
            this.props.details = msg("closed-folder");
          }
          this.props.onDeleteButtonClick = null;
          this.props.onDuplicateButtonClick = null;
          this.props.onExportButtonClick = null;
          this.props.onDeleteButtonClick = null;
          this.props.selected = false;
          this.props.number = null;
          this.props.className += ` ${getFolderColorClass(itemData.folder)}`;
        }
        if (typeof itemData.inFolder === 'string') {
          this.props.className += ` ${getFolderColorClass(itemData.inFolder)}`;
        }

        const result = originalRender.call(this);

        this.props = originalProps;
        return result;
      }
      return originalRender.call(this);
    };
  };

  // Sprite list
  {
    const spriteSelectorItemElement = await addon.tab.waitForElement("[class*='sprite-selector_sprite-wrapper']");
    vm = addon.tab.traps.vm;
    reactInternalKey = Object.keys(spriteSelectorItemElement).find((i) => i.startsWith(REACT_INTERNAL_PREFIX));
    const sortableHOCInstance = getSortableHOCFromElement(spriteSelectorItemElement);
    const spriteSelectorItemInstance = spriteSelectorItemElement[reactInternalKey].child.child.child.stateNode;
    patchSortableHOC(sortableHOCInstance.constructor, TYPE_SPRITES);
    patchSpriteSelectorItem(spriteSelectorItemInstance.constructor);
    sortableHOCInstance.saInitialSetup();

    const originalInstallTargets = vm.installTargets;
    vm.installTargets = function (targets, extensions, wholeProject) {
      // TODO: this is broken
      if (currentSpriteFolder) {
        for (const target of targets) {
          if (target.sprite) {
            target.sprite.name = setFolderOfName(target.sprite.name, currentSpriteFolder);
          }
        }
      }
      return originalInstallTargets.call(this, targets, extensions, wholeProject);
    };

    // const originalReorderTarget = vm.reorderTarget;
    // vm.reorderTarget = function (targetIndex, newIndex) {
    //   const isFolder = (item) => {
    //     return (
    //       item &&
    //       typeof item.name === 'object' &&
    //       typeof item.name.folder === 'string'
    //     );
    //   };
    //   const getRealIndex = (item) => {
    //     if (isFolder(item)) {
    //       const folder = item.costume.asset.sa.folder;
    //       for (let i = 0; i < this.runtime.targets.length; i++) {
    //         const target = this.runtime.targets[i];
    //         if (target.sprite && getFolderFromName(target.sprite.name) === folder) {
    //           return i;
    //         }
    //       }
    //     }
    //     for (let i = 0; i < this.runtime.targets.length; i++) {
    //       const target = this.runtime.targets[i];
    //       if (target.id === item.id) {
    //         return i;
    //       }
    //     }
    //     return -1;
    //   };

    //   const item = currentSpriteItems[targetIndex - 1];
    //   const itemAtNewIndex = currentSpriteItems[newIndex - 1];
    //   if (isFolder(item)) {
    //     let insertAtIndex = getRealIndex(itemAtNewIndex);
    //     const items = [];
    //     const folder = item.costume.asset.sa.folder;
    //     for (let i = this.runtime.targets.length - 1; i >= 0; i--) {
    //       const target = this.runtime.targets[i];
    //       if (target.sprite && getFolderFromName(target.sprite.name) === folder) {
    //         items.push(target);
    //         this.runtime.targets.splice(i, 1);
    //         if (i < insertAtIndex) {
    //           insertAtIndex--;
    //         }
    //       }
    //     }
    //     if (newIndex > targetIndex) {
    //       insertAtIndex++;
    //     }
    //     this.runtime.targets.splice(insertAtIndex, 0, ...items.reverse());
    //     this.emitTargetsUpdate();
    //     return true;
    //   } else {
    //     const realItemIndex = getRealIndex(item, false);
    //     const realIndexOfItemAtNewIndex = getRealIndex(itemAtNewIndex);
    //     if (realItemIndex !== -1 && realIndexOfItemAtNewIndex !== -1) {
    //       return originalReorderTarget.call(this, realItemIndex, realIndexOfItemAtNewIndex);
    //     }
    //   }
    //   return originalReorderTarget.call(this, targetIndex, newIndex);
    // };

    // TODO: huge amounts of code duplication here
    // TODO: do this on sounds too
    // const originalReorderCostume = vm.reorderCostume;
    // vm.reorderCostume = function (targetId, costumeIndex, newIndex) {
    //   const target = this.runtime.getTargetById(targetId);
    //   const costumes = target && target.sprite && target.sprite.costumes;
    //   if (costumes) {
    //     const isFolder = (item) => {
    //       return item && item.asset && item.asset.sa && typeof item.asset.sa.folder === "string";
    //     };
    //     const getRealIndex = (item) => {
    //       if (isFolder(item)) {
    //         const folder = item.asset.sa.folder;
    //         for (let i = 0; i < costumes.length; i++) {
    //           const costume = costumes[i];
    //           if (getFolderFromName(costume.name) === folder) {
    //             return i;
    //           }
    //         }
    //       }
    //       for (let i = 0; i < costumes.length; i++) {
    //         const costume = costumes[i];
    //         if (costume.asset === item.asset) {
    //           return i;
    //         }
    //       }
    //       return -1;
    //     };

    //     const item = currentAssetItems[costumeIndex];
    //     const itemAtNewIndex = currentAssetItems[newIndex];
    //     let insertAtIndex = getRealIndex(itemAtNewIndex);

    //     const items = [];
    //     if (isFolder(item)) {
    //       const folder = item.asset.sa.folder;
    //       for (let i = costumes.length - 1; i >= 0; i--) {
    //         const costume = costumes[i];
    //         if (getFolderFromName(costume.name) === folder) {
    //           if (i < insertAtIndex) {
    //             insertAtIndex--;
    //           }
    //           items.push(costume);
    //           costumes.splice(i, 1);
    //         }
    //       }
    //     } else {
    //       const itemIndex = getRealIndex(item);
    //       if (itemIndex < insertAtIndex) {
    //         insertAtIndex--;
    //       } else {
    //         insertAtIndex++;
    //       }
    //       items.push(costumes[itemIndex]);
    //       costumes.splice(itemIndex, 1);
    //     }

    //     if (newIndex > costumeIndex) {
    //       insertAtIndex++;
    //     }
    //     costumes.splice(insertAtIndex, 0, ...items.reverse());
    //     target.sprite.costumes = costumes;
    //     return;
    //   }
    //   return originalReorderCostume.call(this, targetId, costumeIndex, newIndex);
    // };
  }

  // Costume and sound list
  {
    const selectorListItem = await addon.tab.waitForElement("[class*='selector_list-item']");
    const sortableHOCInstance = getSortableHOCFromElement(selectorListItem);
    patchSortableHOC(sortableHOCInstance.constructor, TYPE_ASSETS);
    sortableHOCInstance.saInitialSetup();
  }
}
