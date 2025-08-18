export default async function ({ addon, console }) {

    // Helper functions for patching SortableHOC taken from the folders addon by GarboMuffin

    let reactInternalKey;
    const TYPE_ASSETS = 2;

    const getSortableHOCFromElement = (el) => {
        let reactInternalInstance;
        const nearestSpriteSelector = el.closest("[class*='sprite-selector_sprite-selector']");
        if (nearestSpriteSelector) {
        reactInternalInstance = nearestSpriteSelector[reactInternalKey].child.sibling;
        }
        const nearestAssetPanelWrapper = el.closest('[class*="asset-panel_wrapper"]');
        if (nearestAssetPanelWrapper) {
        reactInternalInstance = nearestAssetPanelWrapper[reactInternalKey];
        }
        if (reactInternalInstance) {
        while (!isSortableHOC(reactInternalInstance.stateNode)) {
            reactInternalInstance = reactInternalInstance.child;
        }
        return reactInternalInstance.stateNode;
        }
        throw new Error("cannot find SortableHOC");
    };

    const isSortableHOC = (sortableHOCInstance) => {
        try {
        const SortableHOC = sortableHOCInstance.constructor;
        return (
            Array.isArray(sortableHOCInstance.props.items) &&
            (typeof sortableHOCInstance.props.selectedId === "string" ||
            typeof sortableHOCInstance.props.selectedItemIndex === "number") &&
            typeof sortableHOCInstance.containerBox !== "undefined" &&
            typeof SortableHOC.prototype.handleAddSortable === "function" &&
            typeof SortableHOC.prototype.handleRemoveSortable === "function" &&
            typeof SortableHOC.prototype.setRef === "function"
        );
        } catch {
        return false;
        }
    };

    const verifySortableHOC = (sortableHOCInstance) => {
        const SortableHOC = sortableHOCInstance.constructor;
        if (
        isSortableHOC(sortableHOCInstance) &&
        typeof SortableHOC.prototype.componentDidMount === "undefined" &&
        typeof SortableHOC.prototype.componentDidUpdate === "undefined"
        )
        return;
        throw new Error("Can not comprehend SortableHOC");
    };

    // indexForPositionOnList taken from https://github.com/scratchfoundation/scratch-gui/blob/develop/src/lib/drag-utils.js
    const indexForPositionOnList = ({x, y}, boxes, isRtl) => {
        if (boxes.length === 0) return null;
        let index = null;
        const leftEdge = Math.min.apply(null, boxes.map(b => b.left));
        const rightEdge = Math.max.apply(null, boxes.map(b => b.right));
        const topEdge = Math.min.apply(null, boxes.map(b => b.top));
        const bottomEdge = Math.max.apply(null, boxes.map(b => b.bottom));
        for (let n = 0; n < boxes.length; n++) {
            const box = boxes[n];
            // Construct an "extended" box for each, extending out to infinity if
            // the box is along a boundary.
            let minX = box.left === leftEdge ? -Infinity : box.left;
            let maxX = box.right === rightEdge ? Infinity : box.right;
            const minY = box.top === topEdge ? -Infinity : box.top;
            const maxY = box.bottom === bottomEdge ? Infinity : box.bottom;
            // The last item in the wrapped list gets a right edge at infinity, even
            // if it isn't the farthest right, in RTL mode. In LTR mode, it gets a
            // left edge at infinity.
            if (n === boxes.length - 1) {
                if (isRtl) {
                    minX = -Infinity;
                } else {
                    maxX = Infinity;
                }
            }

            // Check if the point is in the bounds.
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                index = n;
                break; // No need to keep looking.
            }
        }
        return index;
    };

    // Here is the original: https://github.com/scratchfoundation/scratch-gui/blob/develop/src/lib/sortable-hoc.jsx
    const patchSortableHOC = (SortableHOC, type) => {

        // Save original function
        const originalCWRP = SortableHOC.prototype.componentWillReceiveProps;

        SortableHOC.prototype.componentWillReceiveProps = function (newProps) {
            originalCWRP.call(this, newProps);

            const scrollContainer = this.ref.querySelector('[class*="selector_list-area"]');

            if (newProps.dragInfo.dragging && !this.props.dragInfo.dragging) {
                // When started dragging
                this.initialScrollTop = scrollContainer.scrollTop;

                // Add scroll listener
                const onScroll = () => {
                    if (this.props.dragInfo.dragging) {
                        this.forceUpdate();
                    }
                };

                scrollContainer.addEventListener('scroll', onScroll);

                // Save listener so it can be removed later
                this._scrollListener = onScroll;

            } else if (!newProps.dragInfo.dragging && this.props.dragInfo.dragging) {
                // When stopped dragging
                if (this._scrollListener) {
                    scrollContainer.removeEventListener('scroll', this._scrollListener);
                    this._scrollListener = null;
                }
            }
        };

        // While dragging
        SortableHOC.prototype.getMouseOverIndex = function () {
            let index = null;
            if (this.props.dragInfo.currentOffset) {
                const scrollContainer = this.ref.querySelector('[class*="selector_list-area"]');
                const x = this.props.dragInfo.currentOffset.x // x isn't affected
                const y = this.props.dragInfo.currentOffset.y
                    + scrollContainer.scrollTop
                    - scrollContainer.getBoundingClientRect().top
                    - this.initialScrollTop
                    + 96;
                
                if (this.boxes.length === 0) {
                    index = 0;
                } else {
                    index = indexForPositionOnList(
                        {x, y},
                        this.boxes,
                        this.props.isRtl
                    );
                }

                // Setting Drag at top/bottom to scroll
                if (addon.settings.get("drag-scroll")) {
                    const containerRect = scrollContainer.getBoundingClientRect();
                    const edgeSize = 30; // Distance from the top/bottom to trigger scroll
                    const scrollSpeed = 5; // I was going to make a setting to change scroll speed but for some reason it broke when you changed it

                    if (this.props.dragInfo.currentOffset.y < containerRect.top + edgeSize) {
                        scrollContainer.scrollTop -= scrollSpeed;
                    } else if (this.props.dragInfo.currentOffset.y > containerRect.bottom - edgeSize) {
                        scrollContainer.scrollTop += scrollSpeed;
                    }
                }
            }
            return index;
        };
    }

    // Taken from folders addon by GarboMuffin
    const selectorListItem = await addon.tab.waitForElement("[class*='selector_list-area']", {
        reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex !== 0 && !state.scratchGui.mode.isPlayerOnly,
    });
    reactInternalKey = addon.tab.traps.getInternalKey(selectorListItem);
    const sortableHOCInstance = getSortableHOCFromElement(selectorListItem);
    verifySortableHOC(sortableHOCInstance);
    patchSortableHOC(sortableHOCInstance.constructor, TYPE_ASSETS);
}
