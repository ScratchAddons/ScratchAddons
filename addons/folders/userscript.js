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

  const leaveFolderAsset = {
    assetId: ID_BACK,
    encodeDataURI() {
      return addon.self.dir + "/leave-folder.svg";
    },
    sa: {
      back: true,
    },
  };

  let reactInternalKey;

  let currentSpriteFolder;

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

  const patchSortableHOC = (SortableHOC, type) => {
    // SortableHOC should be: https://github.com/LLK/scratch-gui/blob/29d9851778febe4e69fa5111bf7559160611e366/src/lib/sortable-hoc.jsx#L8

    const PREVIEW_POSITIONS = [
      // x, y
      [0, 0],
      [16, 0],
      [0, 16],
      [16, 16],
    ];

    const createFolderPreview = (items) => {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("width", "32");
      svg.setAttribute("height", "32");
      for (let i = 0; i < Math.min(PREVIEW_POSITIONS.length, items.length); i++) {
        const item = items[i];
        const image = document.createElementNS(SVG_NS, "image");
        image.setAttribute("width", "16");
        image.setAttribute("height", "16");
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

    const processItems = (folderName, props) => {
      const items = [];
      const result = {
        items,
      };

      if (folderName) {
        const leaveFolderItem = {};
        if (type === TYPE_SPRITES) {
          leaveFolderItem.name = msg("leave-folder");
          leaveFolderItem.id = ID_BACK;
          leaveFolderItem.costume = {
            asset: leaveFolderAsset,
          };
        } else {
          leaveFolderItem.asset = leaveFolderAsset;
        }
        items.push(leaveFolderItem);

        for (const item of props.items) {
          const itemFolder = getFolderFromName(item.name);
          if (itemFolder === folderName) {
            items.push({
              ...item,
              name: getNameWithoutFolder(item.name),
            });
          }
        }
      } else {
        // Do not use {}, otherwise folders named after Object.prototype members will not work
        const folders = Object.create(null);

        for (let i = 0; i < props.items.length; i++) {
          const item = props.items[i];
          const itemFolder = getFolderFromName(item.name);

          if (itemFolder) {
            if (!folders[itemFolder]) {
              const folderItem = {
                items: [],
              };
              const id = `${ID_FOLDER_PREFIX}${itemFolder}`;
              const asset = {
                sa: {
                  folder: itemFolder,
                },
                // We don't know these when the item is created
                get assetId() {
                  return getFolderPreviewAssetId(folderItem.items);
                },
                encodeDataURI() {
                  return createFolderPreview(folderItem.items);
                },
              };
              if (type === TYPE_SPRITES) {
                folderItem.name = `[F] ${itemFolder}`; // TODO
                folderItem.id = id;
                folderItem.costume = {
                  asset,
                };
              } else {
                folderItem.asset = asset;
              }
              folders[itemFolder] = folderItem;
              items.push(folderItem);
            }
            folders[itemFolder].items.push(item);
          } else {
            items.push(item);
            if (type === TYPE_ASSETS) {
              if (!item.asset) {
                item.asset = {};
              }
              if (!item.asset.sa) {
                item.asset.sa = {};
              }
              item.asset.sa.index = i;
            }
          }

          if (type === TYPE_SPRITES) {
            // const isSelected = props.selectedId === item.id;
            // if (isSelected) {
            //   selectedId = items[items.length - 1].id;
            // }
          } else if (type === TYPE_ASSETS) {
            const isSelected = props.selectedItemIndex === i;
            if (isSelected) {
              result.selectedItemIndex = items.length - 1;
            }
          }
        }
      }

      return result;
    };

    // const originalGetOrdering = SortableHOC.prototype.getOrdering;
    // SortableHOC.prototype.getOrdering = function (items, draggingIndex, newIndex) {
    //   const result = originalGetOrdering.call(this, items, draggingIndex, newIndex);
    //   return result;
    // };

    SortableHOC.prototype.componentDidMount = function () {
      currentSpriteFolder = null;
    };

    SortableHOC.prototype.componentDidUpdate = function (prevProps, prevState) {
      // When the selected sprite has changed, switch to its folder.
      if (type === TYPE_SPRITES) {
        if (prevProps.selectedId !== this.props.selectedId) {
          const oldTarget = vm.runtime.getTargetById(prevProps.selectedId);
          const newTarget = vm.runtime.getTargetById(this.props.selectedId);
          if (
            oldTarget &&
            newTarget &&
            oldTarget.sprite &&
            newTarget.sprite &&
            newTarget.isSprite() // ignore stages
          ) {
            const oldFolder = getFolderFromName(oldTarget.sprite.name);
            const newFolder = getFolderFromName(newTarget.sprite.name);
            if (oldFolder !== newFolder) {
              this.setState({
                folder: newFolder,
              });
              return;
            }
          }
        }
      }
    };

    const originalSortableHOCRender = SortableHOC.prototype.render;
    SortableHOC.prototype.render = function () {
      const originalItems = this.props.items;
      // state might not exist yet
      const folder = this.state ? this.state.folder : null;
      Object.assign(this.props, processItems(folder, this.props));
      const result = originalSortableHOCRender.call(this);
      this.props.items = originalItems;
      return result;
    };
  };

  const patchSpriteSelectorItem = (SpriteSelectorItem) => {
    // SpriteSelectorItem should be: https://github.com/LLK/scratch-gui/blob/29d9851778febe4e69fa5111bf7559160611e366/src/containers/sprite-selector-item.jsx#L16

    const setFolder = (component, folder) => {
      const sortableHOCInstance = getSortableHOCFromElement(component.ref);
      sortableHOCInstance.setState({
        folder,
      });
    };

    const originalSpriteSelectorItemHandleClick = SpriteSelectorItem.prototype.handleClick;
    SpriteSelectorItem.prototype.handleClick = function (e) {
      if (this.props.asset && this.props.asset.sa && !this.noClick) {
        const sa = this.props.asset.sa;
        if (sa.back) {
          e.preventDefault();
          setFolder(this, null);
          return;
        }
        if (typeof sa.folder === "string") {
          e.preventDefault();
          setFolder(this, sa.folder);
          return;
        }
        if (typeof sa.index === "number") {
          if (this.props.onClick) {
            this.props.onClick(sa.index);
          }
          return;
        }
      }
      return originalSpriteSelectorItemHandleClick.call(this, e);
    };

    const originalRender = SpriteSelectorItem.prototype.render;
    SpriteSelectorItem.prototype.render = function () {
      if (this.props.asset && this.props.asset.sa) {
        const sa = this.props.asset.sa;
        const originalProps = this.props;
        this.props = {
          ...this.props,
        };

        if (sa.back) {
          this.props.name = msg("leave-folder");
        }
        if (sa.folder) {
          // TODO
          this.props.name = sa.folder;
          this.props.details = "Folder";
        }
        if (sa.back || sa.folder) {
          this.props.onDeleteButtonClick = null;
          this.props.onDuplicateButtonClick = null;
          this.props.onExportButtonClick = null;
          this.props.onDeleteButtonClick = null;
          this.props.selected = false;
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
    reactInternalKey = Object.keys(spriteSelectorItemElement).find((i) => i.startsWith(REACT_INTERNAL_PREFIX));
    const sortableHOCInstance = getSortableHOCFromElement(spriteSelectorItemElement);
    const spriteSelectorItemInstance = spriteSelectorItemElement[reactInternalKey].child.child.child.stateNode;
    patchSortableHOC(sortableHOCInstance.constructor, TYPE_SPRITES);
    patchSpriteSelectorItem(spriteSelectorItemInstance.constructor);
    sortableHOCInstance.forceUpdate();

    vm = addon.tab.traps.vm;
    const originalInstallTargets = vm.installTargets;
    vm.installTargets = function (targets, extensions, wholeProject) {
      if (currentSpriteFolder) {
        for (const target of targets) {
          if (target.sprite) {
            target.sprite.name = setFolderOfName(target.sprite.name, currentSpriteFolder);
          }
        }
      }
      return originalInstallTargets.call(this, targets, extensions, wholeProject);
    };
    // TODO
    // const originalRenameSprite = vm.renameSprite;
    // vm.renameSprite = function (targetId, newName) {
    //   if (currentSpriteFolder) {
    //     newName = setFolderOfName(newName, currentSpriteFolder);
    //   }
    //   return originalRenameSprite.call(this, targetId, newName);
    // };
  }

  // Costume and sound list
  {
    const selectorListItem = await addon.tab.waitForElement("[class*='selector_list-item']");
    const sortableHOCInstance = getSortableHOCFromElement(selectorListItem);
    patchSortableHOC(sortableHOCInstance.constructor, TYPE_ASSETS);
    sortableHOCInstance.forceUpdate();
  }
}
