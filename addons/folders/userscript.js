export default async function ({ addon, global, console, msg }) {
  const REACT_INTERNAL_PREFIX = "__reactInternalInstance$";
  const ID_PREFIX = "sa_";
  const ID_FOLDER_PREFIX = `${ID_PREFIX}folder_folder_`;
  const ID_BACK = `${ID_PREFIX}folder_back`;

  const TYPE_SPRITES = 1;
  const TYPE_ASSETS = 2;

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

  const setFolder = (component, folder) => {
    const sortableHOCInstance = getSortableHOCFromElement(component.ref);
    sortableHOCInstance.setState({
      folder,
    });
  };

  const patchSortableHOC = (SortableHOC, type) => {
    const processItems = (folderName, propItems) => {
      const items = [];

      if (folderName) {
        const backItem = {
          name: msg("back"),
          asset: {
            encodeDataURI() {
              return addon.self.dir + "/back.svg";
            },
          },
        };
        if (type === TYPE_SPRITES) {
          backItem.id = ID_BACK;
        } else {
          backItem.details = ID_BACK;
        }
        items.push(backItem);

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
        const folderItems = {};
        for (const item of propItems) {
          const itemFolder = getFolderFromName(item.name);
          if (itemFolder) {
            if (!folderItems[itemFolder]) {
              const folderItem = {
                name: `[F] ${itemFolder}`, // TODO
              };
              if (type === TYPE_SPRITES) {
                folderItem.id = `${ID_FOLDER_PREFIX}${itemFolder}`;
                folderItem.costume = item.costume;
              } else {
                folderItem.details = `${ID_FOLDER_PREFIX}${itemFolder}`;
                folderItem.asset = item.asset;
              }
              folderItems[itemFolder] = folderItem;
              items.push(folderItem);
            }
          } else {
            items.push(item);
          }
        }
      }

      for (const item of items) {
        if (item.asset) {
          item.costume = {
            asset: item.asset,
          };
        }
      }

      return items;
    };

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
      if (typeof this.props.details === "string" && this.props.details.startsWith(ID_PREFIX)) {
        const details = this.props.details;
        this.props.details = "";
        const result = originalRender.call(this);
        this.props.details = details;
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
