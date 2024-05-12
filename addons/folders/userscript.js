import { escapeHTML } from "../../libraries/common/cs/autoescaper.js";

export default async function ({ addon, console, msg }) {
  // The basic premise of how this addon works is relative simple.
  // scratch-gui renders the sprite selectors and asset selectors in a hierarchy like this:
  // <SelectorHOC>
  //   <SpriteSelectorItem />
  //   <SpriteSelectorItem />
  //   <SpriteSelectorItem />
  //   <SpriteSelectorItem />
  //   ...
  // </SelectorHOC>
  // It's obviously more complicated than that, but there are two important parts:
  // SelectorHOC - We override this to change which items are displayed
  // SpriteSelectorItem - We override this to change how items are displayed.
  //    Folders are just items rendered differently
  // These two components communicate through the `name` property of the items.
  // We touch some things on the VM to make dragging items work properly.

  const REACT_INTERNAL_PREFIX = "__reactInternalInstance$";

  const TYPE_SPRITES = 1;
  const TYPE_ASSETS = 2;

  // We run too early, will be set later
  let vm;

  let reactInternalKey;

  let currentSpriteFolder;
  let currentAssetFolder;

  let currentSpriteItems;
  let currentAssetItems;

  const DIVIDER = "//";

  /**
   * getFolderFromName("B") === null
   * getFolderFromName("A//b") === "A"
   */
  const getFolderFromName = (name) => {
    const idx = name.indexOf(DIVIDER);
    if (idx === -1 || idx === 0) {
      return null;
    }
    return name.substr(0, idx);
  };

  /**
   * getNameWithoutFolder("B") === "B"
   * getNameWithoutFolder("A//b") === "b"
   */
  const getNameWithoutFolder = (name) => {
    const idx = name.indexOf(DIVIDER);
    if (idx === -1 || idx === 0) {
      return name;
    }
    return name.substr(idx + DIVIDER.length);
  };

  /**
   * setFolderOfName("B", "y") === "y//B"
   * setFolderOfName("c//B", "y") === "y//B"
   * setFolderOfName("B", null) === "B"
   * setFolderOfName("c//B", null) === "B"
   */
  const setFolderOfName = (name, folder) => {
    const basename = getNameWithoutFolder(name);
    if (folder) {
      return `${folder}${DIVIDER}${basename}`;
    }
    return basename;
  };

  const isValidFolderName = (name) => {
    return !name.includes(DIVIDER) && !name.endsWith("/");
  };

  const RESERVED_NAMES = ["_mouse_", "_stage_", "_edge_", "_myself_", "_random_"];
  const ensureNotReserved = (name) => {
    if (name === "") return "2";
    if (RESERVED_NAMES.includes(name)) return `${name}2`;
    return name;
  };

  const untilInEditor = () => {
    if (addon.tab.editorMode === "editor") return;
    return new Promise((resolve, reject) => {
      const handler = () => {
        if (addon.tab.editorMode === "editor") {
          resolve();
          addon.tab.removeEventListener("urlChange", handler);
        }
      };
      addon.tab.addEventListener("urlChange", handler);
    });
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

  const getBackpackFromElement = (el) => {
    const gui = el.closest('[class*="gui_editor-wrapper"]');
    if (!gui) throw new Error("cannot find Backpack");
    return gui[reactInternalKey].child.sibling.child.stateNode;
  };

  const clamp = (n, min, max) => {
    return Math.min(Math.max(n, min), max);
  };

  /**
   * @typedef {Object} ItemData
   * @property {string} realName
   * @property {number} realIndex
   * @property {string} inFolder
   * @property {string} folder
   * @property {boolean} folderOpen
   */

  /**
   * @returns {ItemData|null}
   */
  const getItemData = (item) => {
    if (item && item.name && typeof item.name === "object") {
      return item.name;
    }
    return null;
  };

  const openFolderAsset = {
    assetId: "&__sa_folders_folder",
    encodeDataURI() {
      // Doesn't actually need to be a data: URI
      return addon.self.dir + "/folder.svg";
    },
  };

  // https://github.com/scratchfoundation/scratch-gui/blob/develop/src/components/asset-panel/icon--sound.svg
  const imageIconSource = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100px" height="100px" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g id="Sound" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <path d="M12.4785058,12.6666667 C12.3144947,12.6666667 12.1458852,12.6272044 11.9926038,12.5440517 C11.537358,12.2960031 11.3856094,11.7562156 11.6553847,11.3376335 C12.1688774,10.5371131 12.1688774,9.54491867 11.6553847,8.74580756 C11.3856094,8.32581618 11.537358,7.78602861 11.9926038,7.53798001 C12.452448,7.29275014 13.0379829,7.43086811 13.3046926,7.84804076 C14.1737981,9.20103311 14.1737981,10.8809986 13.3046926,12.233991 C13.1268862,12.5130457 12.806528,12.6666667 12.4785058,12.6666667 Z M15.3806784,13.8333333 C15.2408902,13.8333333 15.0958763,13.796281 14.9665396,13.7182064 C14.5785295,13.485306 14.4491928,12.9784829 14.6791247,12.5854634 C15.5949331,11.0160321 15.5949331,9.065491 14.6791247,7.49738299 C14.4491928,7.10436352 14.5785295,6.59621712 14.9665396,6.36331669 C15.3558562,6.13438616 15.8549129,6.26274605 16.0848448,6.65444223 C17.3050517,8.74260632 17.3050517,11.3389168 16.0848448,13.4270809 C15.9319924,13.6890939 15.6602547,13.8333333 15.3806784,13.8333333 Z M10.3043478,5.62501557 L10.3043478,13.873675 C10.3043478,14.850934 9.10969849,15.3625101 8.36478311,14.7038052 L6.7566013,13.2797607 C6.18712394,12.7762834 5.44499329,12.4968737 4.67362297,12.4968737 L4.3923652,12.4968737 C3.62377961,12.4968737 3,11.8935108 3,11.1470686 L3,8.36646989 C3,7.62137743 3.62377961,7.01666471 4.3923652,7.01666471 L4.65830695,7.01666471 C5.42967727,7.01666471 6.17180792,6.73725504 6.74128529,6.23377771 L8.36478311,4.79623519 C9.10969849,4.13753026 10.3043478,4.64910643 10.3043478,5.62501557 Z" id="Combined-Shape" fill="#575E75"></path>
    </g>
</svg>`;
  const soundIconHref = `data:image/svg+xml;base64,${btoa(imageIconSource)}`;

  let folderColorStylesheet = null;
  const folderColors = Object.create(null);
  const getFolderColorClass = (folderName) => {
    const mulberry32 = (a) => {
      // https://stackoverflow.com/a/47593316
      return function () {
        var t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    const hashCode = (str) => {
      // Based on Java's String.hashCode
      // https://hg.openjdk.java.net/jdk8/jdk8/jdk/file/687fd7c7986d/src/share/classes/java/lang/String.java#l1452
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = 31 * hash + str.charCodeAt(i);
        hash = hash | 0;
      }
      return hash;
    };

    const random = (str) => {
      const seed = hashCode(str);
      const rng = mulberry32(seed);
      // Run RNG a few times to get more random numbers, otherwise similar seeds tend to give somewhat similar results
      rng();
      rng();
      rng();
      rng();
      return rng();
    };

    if (!folderColors[folderName]) {
      if (!folderColorStylesheet) {
        folderColorStylesheet = document.createElement("style");
        document.head.appendChild(folderColorStylesheet);
      }
      const hue = random(folderName) * 360;
      const color = `hsla(${hue}deg, 100%, 85%, 0.5)`;
      const id = Object.keys(folderColors).length;
      const className = `sa-folders-color-${id}`;
      folderColors[folderName] = className;
      folderColorStylesheet.textContent += `.${className}{background-color:${color} !important;}`;
      folderColorStylesheet.textContent += `.${className}[class*="sprite-selector_raised"]:not([class*="sa-folders-folder"]){background-color:hsla(${hue}deg, 100%, 77%, 1) !important;}`;
    }
    return folderColors[folderName];
  };

  const fixOrderOfItemsInFolders = (items) => {
    const folders = Object.create(null);
    const result = [];
    for (const item of items) {
      const name = item.getName ? item.getName() : item.name;
      const folder = getFolderFromName(name);
      if (typeof folder === "string") {
        if (!folders[folder]) {
          folders[folder] = [];
          result.push(folders[folder]);
        }
        folders[folder].push(item);
      } else {
        result.push(item);
      }
    }
    const flatResult = result.flat();
    for (let i = 0; i < items.length; i++) {
      if (result[i] !== items[i]) {
        return { items: flatResult, changed: true };
      }
    }
    return { items: flatResult, changed: false };
  };

  const fixTargetOrder = () => {
    const { items, changed } = fixOrderOfItemsInFolders(vm.runtime.targets);
    if (changed) {
      vm.runtime.targets = items;
      vm.emitTargetsUpdate();
    }
  };

  const fixCostumeOrder = (target = vm.editingTarget) => {
    const { items, changed } = fixOrderOfItemsInFolders(target.sprite.costumes);
    if (changed) {
      target.sprite.costumes = items;
      vm.emitTargetsUpdate();
    }
  };

  const fixSoundOrder = (target = vm.editingTarget) => {
    const { items, changed } = fixOrderOfItemsInFolders(target.sprite.sounds);
    if (changed) {
      target.sprite.sounds = items;
      vm.emitTargetsUpdate();
    }
  };

  const verifySortableHOC = (sortableHOCInstance) => {
    const SortableHOC = sortableHOCInstance.constructor;
    if (
      Array.isArray(sortableHOCInstance.props.items) &&
      (typeof sortableHOCInstance.props.selectedId === "string" ||
        typeof sortableHOCInstance.props.selectedItemIndex === "number") &&
      typeof sortableHOCInstance.containerBox !== "undefined" &&
      typeof SortableHOC.prototype.componentDidMount === "undefined" &&
      typeof SortableHOC.prototype.componentDidUpdate === "undefined" &&
      typeof SortableHOC.prototype.handleAddSortable === "function" &&
      typeof SortableHOC.prototype.handleRemoveSortable === "function" &&
      typeof SortableHOC.prototype.setRef === "function"
    )
      return;
    throw new Error("Can not comprehend SortableHOC");
  };

  const verifySpriteSelectorItem = (spriteSelectorItemInstance) => {
    const SpriteSelectorItem = spriteSelectorItemInstance.constructor;
    if (
      typeof spriteSelectorItemInstance.props.asset === "object" &&
      typeof spriteSelectorItemInstance.props.name === "string" &&
      typeof spriteSelectorItemInstance.props.dragType === "string" &&
      typeof SpriteSelectorItem.prototype.handleClick === "function" &&
      typeof SpriteSelectorItem.prototype.setRef === "function" &&
      typeof SpriteSelectorItem.prototype.handleDrag === "function" &&
      typeof SpriteSelectorItem.prototype.handleDragEnd === "function" &&
      typeof SpriteSelectorItem.prototype.handleDelete === "function" &&
      typeof SpriteSelectorItem.prototype.handleDuplicate === "function" &&
      typeof SpriteSelectorItem.prototype.handleExport === "function"
    )
      return;
    throw new Error("Can not comprehend SpriteSelectorItem");
  };

  const verifyVM = (vm) => {
    const target = vm.runtime.targets[0];
    if (
      typeof vm.installTargets === "function" &&
      typeof vm.reorderTarget === "function" &&
      typeof target.reorderCostume === "function" &&
      typeof target.reorderSound === "function" &&
      typeof target.addCostume === "function" &&
      typeof target.addSound === "function"
    )
      return;
    throw new Error("Can not comprehend VM");
  };

  const verifyBackpack = (backpackInstance) => {
    const Backpack = backpackInstance.constructor;
    if (
      typeof Backpack.prototype.handleDrop === "function" &&
      typeof Backpack.prototype.componentDidUpdate === "undefined"
    ) {
      return;
    }
    throw new Error("Can not comprehend Backpack");
  };

  class Cache {
    constructor() {
      this.cache = new Map();
      this.usedThisTick = new Set();
    }

    has(id) {
      return this.cache.has(id);
    }

    get(id) {
      this.usedThisTick.add(id);
      return this.cache.get(id);
    }

    set(id, value) {
      this.usedThisTick.add(id);
      this.cache.set(id, value);
    }

    startTick() {
      this.usedThisTick.clear();
    }

    endTick() {
      for (const id of Array.from(this.cache.keys())) {
        if (!this.usedThisTick.has(id)) {
          this.cache.delete(id);
        }
      }
    }

    clear() {
      this.usedThisTick.clear();
      this.cache.clear();
    }
  }

  const patchSortableHOC = (SortableHOC, type) => {
    // SortableHOC should be: https://github.com/scratchfoundation/scratch-gui/blob/29d9851778febe4e69fa5111bf7559160611e366/src/lib/sortable-hoc.jsx#L8

    const itemCache = new Cache();
    const folderItemCache = new Cache();
    const folderAssetCache = new Cache();

    const PREVIEW_SIZE = 80;
    const PREVIEW_POSITIONS = [
      // x, y
      [0, 0],
      [PREVIEW_SIZE / 2, 0],
      [0, PREVIEW_SIZE / 2],
      [PREVIEW_SIZE / 2, PREVIEW_SIZE / 2],
    ];

    const createFolderPreview = (items) => {
      // Directly generate a string instead of using DOM API for performance as we deal with very large inlined images
      // Because the result is only used as an img src, XSS shouldn't be a concern
      let result = `data:image/svg+xml;,<svg xmlns="http://www.w3.org/2000/svg" width="${PREVIEW_SIZE}" height="${PREVIEW_SIZE}">`;
      for (let i = 0; i < Math.min(PREVIEW_POSITIONS.length, items.length); i++) {
        const item = items[i];
        const width = PREVIEW_SIZE / 2;
        const height = PREVIEW_SIZE / 2;
        const [x, y] = PREVIEW_POSITIONS[i];
        let src;
        if (item.asset) {
          // escaping shouldn't be necessary here but we'll do it anyways for safety
          src = escapeHTML(item.asset.encodeDataURI());
        } else if (item.costume && item.costume.asset) {
          src = escapeHTML(item.costume.asset.encodeDataURI());
        } else if (item.url) {
          src = soundIconHref;
        }
        if (src) {
          result += `<image width="${width}" height="${height}" x="${x}" y="${y}" href="${src}"/>`;
        }
      }
      result += "</svg>";
      return result;
    };

    const getUniqueIdOfFolderItems = (items) => {
      let id = "sa_folder&&";
      for (let i = 0; i < Math.min(PREVIEW_POSITIONS.length, items.length); i++) {
        const item = items[i];
        if (item.asset) {
          id += item.asset.assetId;
        } else if (item.costume && item.costume.asset) {
          id += item.costume.asset.assetId;
        } else if (item.url) {
          id += item.url;
        }
        id += "&&";
      }
      return id;
    };

    const processItems = (openFolders, props) => {
      const processItem = (item) => {
        const itemId = item.name;

        let newItem;
        let itemData;
        if (itemCache.has(itemId)) {
          newItem = itemCache.get(itemId);
          itemData = newItem.name;
        } else {
          itemData = {
            toString() {
              return `_${item.name}`;
            },
          };
          newItem = {};
          itemCache.set(itemId, newItem);
        }

        const itemFolderName = getFolderFromName(item.name);

        Object.assign(newItem, item);
        itemData.realName = item.name;
        itemData.realIndex = i;
        itemData.inFolder = itemFolderName;
        newItem.name = itemData;

        return {
          newItem,
          itemData,
        };
      };

      itemCache.startTick();
      folderItemCache.startTick();
      folderAssetCache.startTick();

      const folderOccurrences = new Map();
      const items = [];
      const result = {
        items,
      };

      let i = 0;
      while (i < props.items.length) {
        const item = props.items[i];
        const folderName = getFolderFromName(item.name);

        if (folderName === null) {
          items.push(processItem(item).newItem);
          if (type === TYPE_ASSETS) {
            const isSelected = props.selectedItemIndex === i;
            if (isSelected) {
              result.selectedItemIndex = items.length - 1;
            }
          }
        } else {
          const isOpen = openFolders.indexOf(folderName) !== -1;
          const folderItems = [];
          while (i < props.items.length) {
            const childItem = props.items[i];
            const processedItem = processItem(childItem);
            if (getFolderFromName(childItem.name) !== folderName) {
              break;
            }
            folderItems.push(processedItem.newItem);
            if (type === TYPE_ASSETS) {
              const isSelected = props.selectedItemIndex === i;
              if (isSelected) {
                if (isOpen) {
                  result.selectedItemIndex = items.length + folderItems.length;
                } else {
                  result.selectedItemIndex = -1;
                }
              }
            }
            i++;
          }
          i--;

          const occurrence = folderOccurrences.get(folderName) || 0;
          folderOccurrences.set(folderName, occurrence + 1);
          const baseUniqueId = getUniqueIdOfFolderItems(folderItems);
          const itemUniqueId = `${isOpen}&${occurrence}&${folderName}&${baseUniqueId}&`;
          const reactKey = `&__${occurrence}_${folderName}`;
          const assetUniqueId = baseUniqueId;

          let folderItem;
          let folderData;
          if (folderItemCache.has(itemUniqueId)) {
            folderItem = folderItemCache.get(itemUniqueId);
            folderData = folderItem.name;
          } else {
            folderItem = {
              // Can be used as a react key
              id: {
                toString() {
                  return reactKey;
                },
              },
            };
            folderData = {
              // Can be used as a react key
              toString() {
                return reactKey;
              },
            };
            folderItemCache.set(itemUniqueId, folderItem);
          }

          folderData.folder = folderName;
          folderData.folderOpen = isOpen;
          folderItem.items = folderItems;
          folderItem.name = folderData;

          let folderAsset;
          if (isOpen) {
            folderAsset = openFolderAsset;
          } else {
            if (folderAssetCache.has(assetUniqueId)) {
              folderAsset = folderAssetCache.get(assetUniqueId);
            } else {
              folderAsset = {
                assetId: assetUniqueId,
                encodeDataURI() {
                  return createFolderPreview(folderItems);
                },
              };
              folderAssetCache.set(assetUniqueId, folderAsset);
            }
          }

          if (type === TYPE_SPRITES) {
            if (!folderItem.costume) folderItem.costume = {};
            folderItem.costume.asset = folderAsset;
            // For sprite items, `id` is used as the drag payload and toString is used as a React key
            if (!folderItem.id) folderItem.id = {};
            folderItem.id.sa_folder_items = folderItems;
            folderItem.id.toString = () => reactKey;
          } else {
            folderItem.asset = folderAsset;
            if (!folderItem.dragPayload) folderItem.dragPayload = {};
            folderItem.dragPayload.sa_folder_items = folderItems;
          }

          items.push(folderItem);
          if (isOpen) {
            for (const item of folderItems) {
              items.push(item);
            }
          }
        }

        i++;
      }

      itemCache.endTick();
      folderItemCache.endTick();
      folderAssetCache.endTick();

      return result;
    };

    const getSelectedItem = (sortable) => {
      if (type === TYPE_SPRITES) {
        const selectedItem = sortable.props.items.find((i) => i.id === sortable.props.selectedId);
        return selectedItem;
      } else if (type === TYPE_ASSETS) {
        const selectedItem = sortable.props.items[sortable.props.selectedItemIndex];
        return selectedItem;
      }
      return null;
    };

    SortableHOC.prototype.saInitialSetup = function () {
      itemCache.clear();
      folderItemCache.clear();
      folderAssetCache.clear();
      const folders = [];
      const selectedItem = getSelectedItem(this);
      if (selectedItem && !selectedItem.isStage) {
        const folder = getFolderFromName(selectedItem.name);
        folders.push(folder);
        if (type === TYPE_SPRITES) {
          currentSpriteFolder = folder;
        } else if (type === TYPE_ASSETS) {
          currentAssetFolder = folder;
        }
      }
      this.setState({
        folders,
      });
    };

    SortableHOC.prototype.componentDidMount = function () {
      // Do part of componentDidUpdate on mount as well
      const selectedItem = getSelectedItem(this);
      if (selectedItem) {
        const folder = getFolderFromName(selectedItem.name);
        if (type === TYPE_SPRITES) {
          currentSpriteFolder = folder;
        } else if (type === TYPE_ASSETS) {
          currentAssetFolder = folder;
        }
      }
      this.saInitialSetup();
    };

    SortableHOC.prototype.componentDidUpdate = function (prevProps, prevState) {
      const selectedItem = getSelectedItem(this);
      if (selectedItem) {
        const folder = getFolderFromName(selectedItem.name);
        const currentFolder = this.state.folders.includes(folder) ? folder : null;
        if (type === TYPE_SPRITES) {
          currentSpriteFolder = currentFolder;
        } else if (type === TYPE_ASSETS) {
          currentAssetFolder = currentFolder;
        }
        let selectedItemChanged;
        if (this.props.selectedId) {
          selectedItemChanged = this.props.selectedId !== prevProps.selectedId;
        } else {
          selectedItemChanged =
            this.props.items[this.props.selectedItemIndex] &&
            prevProps.items[prevProps.selectedItemIndex] &&
            this.props.items[this.props.selectedItemIndex].name !== prevProps.items[prevProps.selectedItemIndex].name;
        }
        if (selectedItemChanged) {
          if (!selectedItem.isStage) {
            if (typeof folder === "string" && !this.state.folders.includes(folder)) {
              this.setState((prevState) => ({
                folders: [...prevState.folders, folder],
              }));
            }
          }
        }
      }
    };

    const originalSortableHOCRender = SortableHOC.prototype.render;
    SortableHOC.prototype.render = function () {
      const originalProps = this.props;
      this.props = {
        ...this.props,
        ...processItems((this.state && this.state.folders) || [], this.props),
      };

      if (type === TYPE_SPRITES) {
        currentSpriteItems = this.props.items;
      } else if (type === TYPE_ASSETS) {
        currentAssetItems = this.props.items;
      }
      const result = originalSortableHOCRender.call(this);
      this.props = originalProps;
      return result;
    };
  };

  const getAllFolders = (component) => {
    const result = new Set();
    let items;
    if (component.props.dragType === "SPRITE") {
      items = currentSpriteItems;
    } else {
      items = currentAssetItems;
    }
    for (const item of items) {
      const data = getItemData(item);
      if (typeof data.folder === "string") {
        result.add(data.folder);
      }
    }
    return Array.from(result);
  };

  const isFolderOpen = (component, folder) => {
    const sortableHOCInstance = getSortableHOCFromElement(component.ref);
    const folders = (sortableHOCInstance.state && sortableHOCInstance.state.folders) || [];
    return folders.includes(folder);
  };

  const setFolderOpen = (component, folder, open) => {
    const sortableHOCInstance = getSortableHOCFromElement(component.ref);
    sortableHOCInstance.setState((prevState) => {
      let folders = (prevState && prevState.folders) || [];
      folders = folders.filter((i) => i !== folder);
      if (open) {
        return {
          folders: [...folders, folder],
        };
      }
      return {
        folders,
      };
    });
  };

  await addon.tab.scratchClassReady();
  addon.tab.createEditorContextMenu((ctxType, ctx) => {
    if (ctxType !== "sprite" && ctxType !== "costume" && ctxType !== "sound") return;
    const component = ctx.target[addon.tab.traps.getInternalKey(ctx.target)].return.return.return.stateNode;
    const data = getItemData(component.props);
    if (!data) return;
    if (typeof data.folder === "string") {
      ctx.target.setAttribute("sa-folders-context-type", "folder");

      const renameItems = (newName) => {
        const isOpen = isFolderOpen(component, data.folder);
        setFolderOpen(component, data.folder, false);
        if (isOpen && typeof newName === "string") {
          setFolderOpen(component, newName, true);
        }
        if (component.props.dragType === "SPRITE") {
          for (const target of vm.runtime.targets) {
            if (target.isOriginal) {
              if (getFolderFromName(target.getName()) === data.folder) {
                vm.renameSprite(target.id, ensureNotReserved(setFolderOfName(target.getName(), newName)));
              }
            }
          }
          vm.emitWorkspaceUpdate();
          fixTargetOrder();
        } else if (component.props.dragType === "COSTUME") {
          for (let i = 0; i < vm.editingTarget.sprite.costumes.length; i++) {
            const costume = vm.editingTarget.sprite.costumes[i];
            if (getFolderFromName(costume.name) === data.folder) {
              vm.renameCostume(i, setFolderOfName(costume.name, newName));
            }
          }
          fixCostumeOrder();
        } else if (component.props.dragType === "SOUND") {
          for (let i = 0; i < vm.editingTarget.sprite.sounds.length; i++) {
            const sound = vm.editingTarget.sprite.sounds[i];
            if (getFolderFromName(sound.name) === data.folder) {
              vm.renameSound(i, setFolderOfName(sound.name, newName));
            }
          }
          fixSoundOrder();
        }
      };
      const renameFolder = async () => {
        let newName = await addon.tab.prompt(
          msg("rename-folder-prompt-title"),
          msg("rename-folder-prompt"),
          data.folder,
          { useEditorClasses: true }
        );
        // Prompt cancelled, do not rename
        if (newName === null) {
          return;
        }
        if (!isValidFolderName(newName)) {
          alert(msg("name-not-allowed"));
          return;
        }
        // Empty name will remove the folder
        if (!newName) {
          newName = null;
        }
        renameItems(newName);
      };

      const removeFolder = () => {
        renameItems(null);
      };
      return [
        {
          className: "sa-folders-rename-folder",
          label: msg("rename-folder"),
          callback: renameFolder,
          position: "assetContextMenuAfterDelete",
          order: 10,
        },
        {
          className: "sa-folders-remove-folder",
          label: msg("remove-folder"),
          callback: removeFolder,
          position: "assetContextMenuAfterDelete",
          order: 11,
        },
      ];
    } else {
      ctx.target.setAttribute("sa-folders-context-type", "asset");
      const setFolder = (folder) => {
        if (component.props.dragType === "SPRITE") {
          const target = vm.runtime.getTargetById(component.props.id);
          vm.renameSprite(component.props.id, ensureNotReserved(setFolderOfName(target.getName(), folder)));
          fixTargetOrder();
          vm.emitWorkspaceUpdate();
        } else if (component.props.dragType === "COSTUME") {
          const data = getItemData(component.props);
          const index = data.realIndex;
          const asset = vm.editingTarget.sprite.costumes[index];
          vm.renameCostume(vm.editingTarget.sprite.costumes.indexOf(asset), setFolderOfName(asset.name, folder));
          fixCostumeOrder();
        } else if (component.props.dragType === "SOUND") {
          const data = getItemData(component.props);
          const index = data.realIndex;
          const asset = vm.editingTarget.sprite.sounds[index];
          vm.renameSound(vm.editingTarget.sprite.sounds.indexOf(asset), setFolderOfName(asset.name, folder));
          fixSoundOrder();
        }
      };

      const createFolder = async () => {
        const name = await addon.tab.prompt(
          msg("name-prompt-title"),
          msg("name-prompt"),
          getNameWithoutFolder(data.realName),
          { useEditorClasses: true }
        );
        if (name === null) {
          return;
        }
        if (!isValidFolderName(name)) {
          alert(msg("name-not-allowed"));
          return;
        }
        setFolder(name);
      };
      const base = [
        {
          border: true,
          className: "sa-folders-create-folder",
          label: msg("create-folder"),
          callback: createFolder,
          position: "assetContextMenuAfterDelete",
          order: 13,
        },
      ];
      const currentFolder = data.inFolder;
      if (typeof currentFolder === "string") {
        base.push({
          className: "sa-folders-remove-from-folder",
          label: msg("remove-from-folder"),
          callback: () => setFolder(null),
          position: "assetContextMenuAfterDelete",
          order: 14,
        });
      }
      return base.concat(
        getAllFolders(component)
          .filter((folder) => folder !== currentFolder)
          .map((folder, i) => {
            return {
              className: "sa-folders-add-to-folder",
              label: msg("add-to-folder", {
                folder,
              }),
              callback: () => setFolder(folder),
              position: "assetContextMenuAfterDelete",
              order: 20 + i,
            };
          })
      );
    }
  });

  const patchSpriteSelectorItem = (SpriteSelectorItem) => {
    for (const method of ["handleDelete", "handleDuplicate", "handleExport"]) {
      const original = SpriteSelectorItem.prototype[method];
      SpriteSelectorItem.prototype[method] = function (...args) {
        if (typeof this.props.id === "number") {
          const itemData = getItemData(this.props);
          if (itemData) {
            const originalProps = this.props;
            this.props = {
              ...originalProps,
              id: itemData.realIndex,
            };
            const ret = original.call(this, ...args);
            this.props = originalProps;
            return ret;
          }
        }
        return original.call(this, ...args);
      };
    }

    const originalHandleDragEnd = SpriteSelectorItem.prototype.handleDragEnd;
    SpriteSelectorItem.prototype.handleDragEnd = function (...args) {
      const itemData = getItemData(this.props);
      if (itemData) {
        if (typeof itemData.realIndex === "number" && this.props.dragging) {
          // If the item is being dragged onto another group (eg. costume list -> sprite list)
          // then we fake a drag event to make the `index` be the real index
          const originalIndex = this.props.index;
          const realIndex = itemData.realIndex;
          if (originalIndex !== realIndex) {
            const currentOffset = addon.tab.redux.state.scratchGui.assetDrag.currentOffset;
            const sortableHOCInstance = getSortableHOCFromElement(this.ref);
            if (currentOffset && sortableHOCInstance && sortableHOCInstance.getMouseOverIndex() === null) {
              this.props.index = realIndex;
              this.handleDrag(currentOffset);
              this.props.index = originalIndex;
            }
          }
        }
      }
      return originalHandleDragEnd.call(this, ...args);
    };

    const originalHandleClick = SpriteSelectorItem.prototype.handleClick;
    SpriteSelectorItem.prototype.handleClick = function (...args) {
      const e = args[0];
      if (e && !this.noClick) {
        const itemData = getItemData(this.props);
        if (itemData) {
          if (typeof itemData.folder === "string") {
            e.preventDefault();
            setFolderOpen(this, itemData.folder, !isFolderOpen(this, itemData.folder));
            return;
          }
          if (typeof this.props.number === "number" && typeof itemData.realIndex === "number") {
            e.preventDefault();
            if (this.props.onClick) {
              this.props.onClick(itemData.realIndex);
            }
            return;
          }
        }
      }
      return originalHandleClick.call(this, ...args);
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
          this.props.name = getNameWithoutFolder(itemData.realName);
        }
        if (typeof this.props.number === "number" && typeof itemData.realIndex === "number") {
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
          this.props.selected = false;
          this.props.number = null;
          this.props.className += ` ${getFolderColorClass(itemData.folder)} sa-folders-folder`;
        }
        if (typeof itemData.inFolder === "string") {
          this.props.className += ` ${getFolderColorClass(itemData.inFolder)}`;
        }

        const result = originalRender.call(this);

        this.props = originalProps;
        return result;
      }
      return originalRender.call(this);
    };
  };

  const patchVM = () => {
    const RenderedTarget = vm.runtime.targets[0].constructor;

    const originalInstallTargets = vm.installTargets;
    vm.installTargets = function (...args) {
      if (currentSpriteFolder !== null) {
        const targets = args[0];
        const wholeProject = args[2];
        if (Array.isArray(targets) && !wholeProject) {
          for (const target of targets) {
            if (target.sprite) {
              target.sprite.name = setFolderOfName(target.sprite.name, currentSpriteFolder);
            }
          }
        }
      }
      return originalInstallTargets.call(this, ...args).then((r) => {
        fixTargetOrder();
        return r;
      });
    };

    const originalDuplicateSprite = vm.duplicateSprite;
    vm.duplicateSprite = function (...args) {
      return originalDuplicateSprite.call(this, ...args).then((r) => {
        fixTargetOrder();
        return r;
      });
    };

    const originalAddCostume = RenderedTarget.prototype.addCostume;
    RenderedTarget.prototype.addCostume = function (...args) {
      if (currentAssetFolder !== null) {
        const costume = args[0];
        if (costume && typeof getFolderFromName(costume.name) !== "string") {
          costume.name = setFolderOfName(costume.name, currentAssetFolder);
        }
      }
      const r = originalAddCostume.call(this, ...args);
      fixCostumeOrder(this);
      return r;
    };

    const originalAddSound = RenderedTarget.prototype.addSound;
    RenderedTarget.prototype.addSound = function (...args) {
      if (currentAssetFolder !== null) {
        const sound = args[0];
        if (sound && typeof getFolderFromName(sound.name) !== "string") {
          sound.name = setFolderOfName(sound.name, currentAssetFolder);
        }
      }
      const r = originalAddSound.call(this, ...args);
      fixSoundOrder(this);
      return r;
    };

    const abstractReorder = (
      { guiItems, getAll, set, rename, getVMItemFromGUIItem, zeroIndexed, onFolderChanged },
      itemIndex,
      newIndex
    ) => {
      // First index depends on zeroIndexed
      itemIndex = clamp(itemIndex, zeroIndexed ? 0 : 1, zeroIndexed ? guiItems.length - 1 : guiItems.length);
      newIndex = clamp(newIndex, zeroIndexed ? 0 : 1, zeroIndexed ? guiItems.length - 1 : guiItems.length);
      if (itemIndex === newIndex) {
        return false;
      }

      let assets = getAll();
      const originalAssets = getAll();

      const targetItem = guiItems[itemIndex - (zeroIndexed ? 0 : 1)];
      const itemAtNewIndex = guiItems[newIndex - (zeroIndexed ? 0 : 1)];
      const targetItemData = getItemData(targetItem);
      const itemAtNewIndexData = getItemData(itemAtNewIndex);

      if (!targetItemData || !itemAtNewIndexData) {
        console.warn("should never happen");
        return false;
      }

      const reorderingItems = typeof targetItemData.folder === "string" ? targetItem.items : [targetItem];
      const reorderingAssets = reorderingItems.map((i) => getVMItemFromGUIItem(i, assets)).filter((i) => i);
      if (typeof itemAtNewIndexData.realIndex === "number") {
        const newTarget = getVMItemFromGUIItem(itemAtNewIndex, assets);
        if (!newTarget || reorderingAssets.includes(newTarget)) {
          // Dragging folder into itself or target doesn't exist. Ignore.
          return false;
        }
      }

      let newFolder = null;

      assets = assets.filter((i) => !reorderingAssets.includes(i));

      let realNewIndex;
      if (newIndex === (zeroIndexed ? 0 : 1)) {
        realNewIndex = zeroIndexed ? 0 : 1;
      } else if (newIndex === guiItems.length - (zeroIndexed ? 1 : 0)) {
        realNewIndex = assets.length;
      } else if (typeof itemAtNewIndexData.realIndex === "number") {
        newFolder = typeof itemAtNewIndexData.inFolder === "string" ? itemAtNewIndexData.inFolder : null;
        let newAsset = getVMItemFromGUIItem(itemAtNewIndex, assets);
        if (!newAsset) {
          console.warn("should never happen");
          return false;
        }
        realNewIndex = assets.indexOf(newAsset);
        if (newIndex > itemIndex) {
          realNewIndex++;
        }
      } else if (typeof itemAtNewIndexData.folder === "string") {
        let item;
        let offset = 0;
        if (newIndex < itemIndex) {
          // A B [C D E] F G
          //    ^----------*
          // A B C [D] E F G
          //      ^--------*
          item = itemAtNewIndex.items[0];
        } else if (itemAtNewIndexData.folderOpen) {
          // A B [C D E] F G
          //   *---^
          item = itemAtNewIndex.items[0];
          newFolder = itemAtNewIndexData.folder;
        } else {
          // A B [C] D E F G
          //   *----^
          item = itemAtNewIndex.items[itemAtNewIndex.items.length - 1];
          offset = 1;
        }
        let newAsset = getVMItemFromGUIItem(item, assets);
        if (newAsset) {
          realNewIndex = assets.indexOf(newAsset) + offset;
        } else {
          // Edge case: Dragging the first item of a list on top of the folder item
          // A B [C D E] F G
          //    ^---*
          newAsset = getVMItemFromGUIItem(item, originalAssets);
          if (!newAsset) {
            console.warn("should never happen");
            return false;
          }
          realNewIndex = originalAssets.indexOf(newAsset) + offset;
        }
      } else {
        console.warn("should never happen");
        return false;
      }

      if (typeof targetItemData.folder === "string" && newFolder !== null) {
        // Cannot drag a folder into another folder
        return;
      }

      if (realNewIndex < (zeroIndexed ? 0 : 1) || realNewIndex > assets.length) {
        console.warn("should never happen");
        return false;
      }

      assets.splice(realNewIndex, 0, ...reorderingAssets);
      set(assets);

      // If the folder has changed, update item names to match.
      if (typeof targetItemData.folder !== "string" && targetItemData.inFolder !== newFolder) {
        for (const asset of reorderingAssets) {
          const name = asset.getName ? asset.getName() : asset.name;
          rename(asset, setFolderOfName(name, newFolder));
        }
        if (onFolderChanged) {
          onFolderChanged();
        }
      }

      return true;
    };

    vm.constructor.prototype.reorderTarget = function (targetIndex, newIndex) {
      return abstractReorder(
        {
          getAll: () => {
            return this.runtime.targets;
          },
          set: (targets) => {
            this.runtime.targets = targets;
            this.emitTargetsUpdate();
          },
          rename: (item, name) => {
            this.renameSprite(item.id, ensureNotReserved(name));
          },
          getVMItemFromGUIItem: (item, targets) => {
            return targets.find((i) => i.id === item.id);
          },
          onFolderChanged: () => {
            this.emitWorkspaceUpdate();
          },
          guiItems: currentSpriteItems,
          zeroIndexed: false,
        },
        targetIndex,
        newIndex
      );
    };

    RenderedTarget.prototype.reorderCostume = function (costumeIndex, newIndex) {
      return abstractReorder(
        {
          getAll: () => {
            return this.sprite.costumes;
          },
          set: (assets) => {
            this.sprite.costumes = assets;
          },
          rename: (item, name) => {
            this.renameCostume(this.sprite.costumes.indexOf(item), name);
          },
          getVMItemFromGUIItem: (item, costumes) => {
            const itemData = getItemData(item);
            return costumes.find((c) => c.name === itemData.realName);
          },
          guiItems: currentAssetItems,
          zeroIndexed: true,
        },
        costumeIndex,
        newIndex
      );
    };

    RenderedTarget.prototype.reorderSound = function (soundIndex, newIndex) {
      return abstractReorder(
        {
          getAll: () => {
            return this.sprite.sounds;
          },
          set: (assets) => {
            this.sprite.sounds = assets;
          },
          rename: (item, name) => {
            this.renameSound(this.sprite.sounds.indexOf(item), name);
          },
          getVMItemFromGUIItem: (item, sounds) => {
            const itemData = getItemData(item);
            return sounds.find((c) => c.name === itemData.realName);
          },
          guiItems: currentAssetItems,
          zeroIndexed: true,
        },
        soundIndex,
        newIndex
      );
    };

    // Temporal bug fix for #5762
    const originalShareSoundToTarget = vm.shareSoundToTarget;
    vm.shareSoundToTarget = function (...args) {
      const target = this.runtime.getTargetById(args[1]);
      if (!target) {
        // Avoid reading property from null
        return Promise.reject(new Error("Dropping sound into folder is not supported"));
        // This would also work no matter what we returned, probably
        // Original method returns a promise, so here too
      }
      return originalShareSoundToTarget.call(this, ...args);
    };
  };

  const patchBackpack = (backpackInstance) => {
    const Backpack = backpackInstance.constructor;
    Backpack.prototype.sa_loadNextItem = function () {
      if (!this.sa_queuedItems) return;
      const item = this.sa_queuedItems.pop();
      if (item) {
        let payload;
        let type;
        if (item.dragPayload) {
          if (item.url) {
            type = "SOUND";
          } else {
            type = "COSTUME";
          }
          payload = item.dragPayload;
        } else if (item.id) {
          type = "SPRITE";
          payload = item.id;
        }
        if (type && payload) {
          originalHandleDrop.call(this, {
            dragType: type,
            payload: payload,
          });
        }
      }
    };

    Backpack.prototype.componentDidUpdate = function (prevProps, prevState) {
      if (!this.state.loading && prevState.loading && !this.state.error) {
        this.sa_loadNextItem();
      }
    };

    const originalHandleDrop = Backpack.prototype.handleDrop;
    Backpack.prototype.handleDrop = function (...args) {
      // When a folder is dropped into the backpack, upload all the items in the folder.
      const dragInfo = args[0];
      const folderItems = dragInfo && dragInfo.payload && dragInfo.payload.sa_folder_items;
      if (Array.isArray(folderItems)) {
        addon.tab.confirm("", msg("confirm-backpack-folder"), { useEditorClasses: true }).then((result) => {
          if (!result) return;
          this.sa_queuedItems = folderItems;
          this.sa_loadNextItem();
        });
        return;
      }
      return originalHandleDrop.call(this, ...args);
    };
    backpackInstance.handleDrop = Backpack.prototype.handleDrop.bind(backpackInstance);
  };

  await untilInEditor();

  // Backpack
  {
    const clickListener = (e) => {
      if (!e.target.closest('[class*="backpack_backpack-header_"]')) {
        return;
      }
      setTimeout(() => {
        const backpackContainer = document.querySelector("[class^='backpack_backpack-list_']");
        if (!backpackContainer) {
          return;
        }
        document.removeEventListener("click", clickListener);
        const backpackInstance = getBackpackFromElement(backpackContainer);
        verifyBackpack(backpackInstance);
        patchBackpack(backpackInstance);
      });
    };
    document.addEventListener("click", clickListener, true);
  }

  // Sprite list
  {
    const spriteSelectorItemElement = await addon.tab.waitForElement("[class^='sprite-selector_sprite-wrapper']", {
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    vm = addon.tab.traps.vm;
    reactInternalKey = Object.keys(spriteSelectorItemElement).find((i) => i.startsWith(REACT_INTERNAL_PREFIX));
    const sortableHOCInstance = getSortableHOCFromElement(spriteSelectorItemElement);
    const spriteSelectorItemInstance = spriteSelectorItemElement[reactInternalKey].child.child.child.stateNode;
    verifySortableHOC(sortableHOCInstance);
    verifySpriteSelectorItem(spriteSelectorItemInstance);
    verifyVM(vm);
    patchSortableHOC(sortableHOCInstance.constructor, TYPE_SPRITES);
    patchSpriteSelectorItem(spriteSelectorItemInstance.constructor);
    sortableHOCInstance.saInitialSetup();
    patchVM();
  }

  // Costume and sound list
  {
    const selectorListItem = await addon.tab.waitForElement("[class*='selector_list-item']", {
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex !== 0 && !state.scratchGui.mode.isPlayerOnly,
    });
    const sortableHOCInstance = getSortableHOCFromElement(selectorListItem);
    verifySortableHOC(sortableHOCInstance);
    patchSortableHOC(sortableHOCInstance.constructor, TYPE_ASSETS);
    sortableHOCInstance.saInitialSetup();
  }
}
