export default async function ({ addon, global, console, msg }) {
  const REACT_INTERNAL_PREFIX = "__reactInternalInstance$";
  const ID_FOLDER_PREFIX = "sa_folder_folder_";
  const ID_BACK = "sa_folder_back";

  let reactInternalKey;

  const getFolderFromName = (name) => {
    const idx = name.indexOf("/");
    if (idx === -1) {
      return null;
    }
    return name.substr(0, idx);
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
    throw new Error('cannot find SortableHOC');
  };

  const setFolder = (component, folder) => {
    const sortableHOCInstance = getSortableHOCFromElement(component.ref);
    sortableHOCInstance.setState({
      folder,
    });
  };

  const patchSortableHOC = (SortableHOC) => {
    SortableHOC.prototype.componentDidUpdate = function (prevProps, prevState) {
      console.log(this.props.items);
      const folder = this.state ? this.state.folder : null;
      if (!prevState || prevState.folder !== folder || prevProps.items !== this.props.items) {
        const items = [];
  
        if (folder) {
          const backItem = {
            name: msg("back"),
            id: ID_BACK,
            costume: {
              asset: {
                encodeDataURI() {
                  return addon.self.dir + '/back.svg';
                }
              }
            }
          };
          items.push(backItem);
  
          for (const item of this.props.items) {
            const itemFolder = getFolderFromName(item.name);
            if (itemFolder === folder) {
              items.push(item);
            }
          }
        } else {
          const folderItems = {};
          for (const item of this.props.items) {
            const itemFolder = getFolderFromName(item.name);
            if (itemFolder) {
              if (!folderItems[itemFolder]) {
                const itemProp = {
                  name: `[F] ${itemFolder}`, // TODO
                  id: `${ID_FOLDER_PREFIX}${itemFolder}`,
                  costume: item.costume,
                };
                folderItems[itemFolder] = itemProp;
                items.push(itemProp);
              }
              // if (item.id === this.props.selectedId) {
              //   this.props.selectedId = folderItems[itemFolder].id;
              // }
            } else {
              items.push(item);
            }
          }
        }
        this.setState({
          items,
        });
      }
    };
  
    const originalSortableHOCRender = SortableHOC.prototype.render;
    SortableHOC.prototype.render = function () {
      if (!this.state) {
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
      if (typeof this.props.id === 'string') {
        if (this.props.id === ID_BACK) {
          e.preventDefault();
          setFolder(this, null);
          return;
        }
        if (this.props.id.startsWith(ID_FOLDER_PREFIX)) {
          e.preventDefault();
          const folderName = this.props.id.substr(ID_FOLDER_PREFIX.length);
          setFolder(this, folderName);
          return;
        }
      }
      originalSpriteSelectorItemHandleClick.call(this, e);
    };
  };

  // Sprite list
  {
    const spriteSelectorItemElement = await addon.tab.waitForElement("[class*='sprite-selector_sprite-wrapper']");  
    reactInternalKey = Object.keys(spriteSelectorItemElement).find((i) => i.startsWith(REACT_INTERNAL_PREFIX));
    const sortableHOCInstance = getSortableHOCFromElement(spriteSelectorItemElement);
    const spriteSelectorItemInstance = spriteSelectorItemElement[reactInternalKey].child.child.child.stateNode;
    patchSortableHOC(sortableHOCInstance.constructor);
    patchSpriteSelectorItem(spriteSelectorItemInstance.constructor);
    sortableHOCInstance.forceUpdate();
  }

  // Costume and sound list
  {
    const selectorListItem = await addon.tab.waitForElement("[class*='selector_list-item']");
    const sortableHOCInstance = getSortableHOCFromElement(selectorListItem);
    patchSortableHOC(sortableHOCInstance.constructor);
    sortableHOCInstance.forceUpdate();
  }
}
