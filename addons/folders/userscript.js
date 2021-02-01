export default async function ({addon, global, console}) {
  const REACT_INTERNAL_PREFIX = '__reactInternalInstance$';
  let hasInjectedReactInternals = false;

  const ID_FOLDER_PREFIX = "sa_folder_folder_";
  const ID_BACK = "sa_folder_back";

  const getFolderFromName = name => {
    const idx = name.indexOf('/');
    if (idx === -1) {
      return null;
    }
    return name.substr(0, idx);
  };

  let SortableHOCInstance;

  while (true) {
    const spriteSelector = await addon.tab.waitForElement("[class*='sprite-selector_sprite-selector']", {
      markAsSeen: true
    });

    const reactInternalKey = Object.keys(spriteSelector).find(i => i.startsWith(REACT_INTERNAL_PREFIX));
    SortableHOCInstance = spriteSelector[reactInternalKey].child.sibling.child.stateNode;

    if (!hasInjectedReactInternals) {
      hasInjectedReactInternals = true;

      const setFolder = (folder) => {
        // TODO: calculate everything here to avoid two setState
        SortableHOCInstance.setState({
          folder
        });
      };

      const spriteSelectorItem = await addon.tab.waitForElement("[class*='sprite-selector_sprite-wrapper']");
      const SpriteSelectorItemInstance = spriteSelectorItem[reactInternalKey].child.child.child.stateNode;

      const SortableHOC = SortableHOCInstance.constructor;
      const SpriteSelectorItem = SpriteSelectorItemInstance.constructor;

      SortableHOC.prototype.componentDidUpdate = function (prevProps, prevState) {
        const folder = this.state ? this.state.folder : null;
        if (!prevState || prevState.folder !== folder || prevProps.items !== this.props.items) {
          const items = [];
          if (folder) {
            items.push({
              name: 'Back',
              id: ID_BACK
            });
            for (const item of this.props.items) {
              const itemFolder = getFolderFromName(item.name);
              if (itemFolder === folder) {
                items.push(item);
              }
            }
          } else {
            const alreadyIncludedFolders = [];
            for (const item of this.props.items) {
              const itemFolder = getFolderFromName(item.name);
              if (itemFolder) {
                if (alreadyIncludedFolders.includes(itemFolder)) {
                  continue;
                }
                // TODO: highlight if active
                alreadyIncludedFolders.push(itemFolder);
                items.push({
                  name: itemFolder,
                  id: `${ID_FOLDER_PREFIX}${itemFolder}`
                });
              } else {
                items.push(item);
              }
            }
          }
          this.setState({
            items
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

      // TODO: pretend that folder is selected if something inside it is
      const originalSpriteSelectorItemHandleClick = SpriteSelectorItem.prototype.handleClick;
      SpriteSelectorItem.prototype.handleClick = function (e) {
        if (this.props.id === ID_BACK) {
          e.preventDefault();
          setFolder(null);
          return;
        }
        if (this.props.id.startsWith(ID_FOLDER_PREFIX)) {
          e.preventDefault();
          const folderName = this.props.id.substr(ID_FOLDER_PREFIX.length);
          setFolder(folderName);
          return;
        }
        originalSpriteSelectorItemHandleClick.call(this, e);
      };
    }
  }
}
