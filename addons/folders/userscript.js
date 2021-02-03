export default async function ({ addon, global, console, msg }) {
  const REACT_INTERNAL_PREFIX = "__reactInternalInstance$";
  const ID_PREFIX = "sa_";
  const ID_FOLDER_PREFIX = `${ID_PREFIX}folder_folder_`;
  const ID_BACK = `${ID_PREFIX}folder_back`;

  const SVG_NS = "http://www.w3.org/2000/svg";

  const TYPE_SPRITES = 1;
  const TYPE_ASSETS = 2;

  const leaveFolderAsset = {
    assetId: ID_BACK,
    encodeDataURI() {
      return addon.self.dir + "/leave-folder.svg";
    },
  };

  let reactInternalKey;

  const getFolderFromName = (name) => {
    const idx = name.indexOf("/");
    if (idx === -1) {
      return null;
    }
    return name.substr(0, idx);
  };

  const getNameWithoutFolder = (name) => {
    const idx = name.indexOf("/");
    if (idx === -1) {
      return name;
    }
    return name.substr(idx + 1);
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

    const processItems = (folderName, propItems) => {
      const items = [];

      if (folderName) {
        const leaveFolderItem = {};
        if (type === TYPE_SPRITES) {
          leaveFolderItem.name = msg("leave-folder");
          leaveFolderItem.id = ID_BACK;
          leaveFolderItem.costume = {
            asset: leaveFolderAsset,
          };
        } else {
          leaveFolderItem.name = ID_BACK;
          leaveFolderItem.details = ID_BACK;
          leaveFolderItem.asset = leaveFolderAsset;
        }
        items.push(leaveFolderItem);

        for (const item of propItems) {
          const itemFolder = getFolderFromName(item.name);
          if (itemFolder === folderName) {
            items.push({
              ...item,
              name: getNameWithoutFolder(item.name),
            });
          }
        }
      } else {
        const folders = {};
        for (const item of propItems) {
          const itemFolder = getFolderFromName(item.name);
          if (itemFolder) {
            if (!folders[itemFolder]) {
              const folderItem = {
                items: [],
              };
              const id = `${ID_FOLDER_PREFIX}${itemFolder}`;
              const asset = {
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
                folderItem.name = id;
                folderItem.details = id;
                folderItem.asset = asset;
              }
              folders[itemFolder] = folderItem;
            }
            folders[itemFolder].items.push(item);
          } else {
            items.push(item);
          }
        }
        for (const folder of Object.keys(folders).reverse()) {
          const item = folders[folder];
          items.unshift(item);
        }
      }

      return items;
    };

    // const originalGetOrdering = SortableHOC.prototype.getOrdering;
    // SortableHOC.prototype.getOrdering = function (items, draggingIndex, newIndex) {
    //   const result = originalGetOrdering.call(this, items, draggingIndex, newIndex);
    //   return result;
    // };

    SortableHOC.prototype.componentDidMount = function () {
      this.setState({
        items: processItems(null, this.props.items),
      });
    };

    SortableHOC.prototype.componentDidUpdate = function (prevProps, prevState) {
      const folder = this.state ? this.state.folder : null;
      if (!prevState || prevState.folder !== folder || prevProps.items !== this.props.items) {
        this.setState({
          items: processItems(folder, this.props.items),
        });
      }
    };

    const originalSortableHOCRender = SortableHOC.prototype.render;
    SortableHOC.prototype.render = function () {
      if (!this.state) {
        // TODO: remove?
        return originalSortableHOCRender.call(this);
      }

      const originalItems = this.props.items;
      this.props.items = this.state.items;
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
      if (!this.noClick) {
        const id = this.props.id || this.props.details;
        if (typeof id === "string") {
          if (id === ID_BACK) {
            e.preventDefault();
            setFolder(this, null);
            return;
          }
          if (id.startsWith(ID_FOLDER_PREFIX)) {
            e.preventDefault();
            setFolder(this, id.substr(ID_FOLDER_PREFIX.length));
            return;
          }
        }
      }
      originalSpriteSelectorItemHandleClick.call(this, e);
    };

    const originalRender = SpriteSelectorItem.prototype.render;
    SpriteSelectorItem.prototype.render = function () {
      if (
        (typeof this.props.details === "string" && this.props.details.startsWith(ID_PREFIX)) ||
        (typeof this.props.id === "string" && this.props.id.startsWith(ID_PREFIX))
      ) {
        const originalProps = this.props;
        this.props = {
          ...this.props
        };

        this.props.details = "";
        if (this.props.name === ID_BACK) {
          this.props.name = msg("leave-folder");
        } else if (this.props.name.startsWith(ID_PREFIX)) {
          this.props.name = `[F] ${originalName.substr(ID_FOLDER_PREFIX.length)}`;
        }
        this.props.onDeleteButtonClick = null;
        this.props.onDuplicateButtonClick = null;
        this.props.onExportButtonClick = null;
        this.props.onDeleteButtonClick = null;

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
  }

  // Costume and sound list
  {
    const selectorListItem = await addon.tab.waitForElement("[class*='selector_list-item']");
    const sortableHOCInstance = getSortableHOCFromElement(selectorListItem);
    patchSortableHOC(sortableHOCInstance.constructor, TYPE_ASSETS);
    sortableHOCInstance.forceUpdate();
  }
}
