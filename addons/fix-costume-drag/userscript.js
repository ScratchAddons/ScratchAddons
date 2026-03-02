// Helper functions for patching SortableHOC taken from the folders addon by GarboMuffin
import {
  getSortableHOCFromElement,
  verifySortableHOC,
  setReactInternalKey,
} from "../../libraries/common/cs/patch-SortableHOC.js";

export default async function ({ addon, console }) {
  // Related to settings
  const SPEED_PRESETS = {
    none: 0,
    slow: 5,
    default: 10,
    fast: 15,
  };
  let scrollSpeed = SPEED_PRESETS[addon.settings.get("scroll-speed")];
  let lastTime = NaN;

  // indexForPositionOnList taken from https://github.com/scratchfoundation/scratch-gui/blob/develop/src/lib/drag-utils.js
  const indexForPositionOnList = ({ x, y }, boxes, isRtl) => {
    if (boxes.length === 0) return null;
    let index = null;
    const leftEdge = Math.min.apply(
      null,
      boxes.map((b) => b.left)
    );
    const rightEdge = Math.max.apply(
      null,
      boxes.map((b) => b.right)
    );
    const topEdge = Math.min.apply(
      null,
      boxes.map((b) => b.top)
    );
    const bottomEdge = Math.max.apply(
      null,
      boxes.map((b) => b.bottom)
    );
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
  const patchSortableHOC = (SortableHOC) => {
    // Save original functions
    const originalCWRP = SortableHOC.prototype.componentWillReceiveProps;
    const originalGetMouseOverIndex = SortableHOC.prototype.getMouseOverIndex;

    SortableHOC.prototype.componentWillReceiveProps = function (newProps) {
      originalCWRP.call(this, newProps);

      // Just call original function if disabled or is a sprite
      if (addon.self.disabled || this.props.dragInfo.dragType === "SPRITE") {
        return;
      }

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

        scrollContainer.addEventListener("scroll", onScroll);

        // Save listener so it can be removed later
        this._scrollListener = onScroll;
      } else if (!newProps.dragInfo.dragging && this.props.dragInfo.dragging) {
        // When stopped dragging
        if (this._scrollListener) {
          scrollContainer.removeEventListener("scroll", this._scrollListener);
          this._scrollListener = null;
        }
      }
    };

    // While dragging
    SortableHOC.prototype.getMouseOverIndex = function () {
      // Just call original function if disabled or is a sprite
      if (addon.self.disabled || this.props.dragInfo.dragType === "SPRITE") {
        return originalGetMouseOverIndex.call(this);
      }

      let index = null;
      if (this.props.dragInfo.currentOffset) {
        const scrollContainer = this.ref.querySelector('[class*="selector_list-area"]');
        const containerRect = scrollContainer.getBoundingClientRect();
        const x = this.props.dragInfo.currentOffset.x; // x isn't affected
        const y =
          this.props.dragInfo.currentOffset.y +
          scrollContainer.scrollTop -
          containerRect.top -
          this.initialScrollTop +
          96;

        const { left, right } = this.containerBox;
        if (x >= left && x <= right) {
          if (this.boxes.length === 0) {
            index = 0;
          } else {
            index = indexForPositionOnList({ x, y }, this.boxes, this.props.isRtl);
          }

          // Auto scroll
          const edgeSize = 30; // Distance from the top/bottom to trigger scroll
          const deltaTime = performance.now() - lastTime;
          // Drag updates happen whenever you move your mouse or the list is scrolled, so if your mouse
          // approaches the auto-scroll zone very slowly, the rate of drag updates will decrease which
          // means delta time will be greater. That's why it is capped at 100ms:
          const scrollAmount = (scrollSpeed / 15) * Math.min(deltaTime, 100);
          if (this.props.dragInfo.currentOffset.y < containerRect.top + edgeSize) {
            scrollContainer.scrollTop -= scrollAmount;
          } else if (this.props.dragInfo.currentOffset.y > containerRect.bottom - edgeSize) {
            scrollContainer.scrollTop += scrollAmount;
          }
        }
      }
      lastTime = performance.now();
      return index;
    };
  };

  // When settings changed
  addon.settings.addEventListener("change", function () {
    scrollSpeed = SPEED_PRESETS[addon.settings.get("scroll-speed")];
  });

  // Taken from folders addon by GarboMuffin
  const selectorListItem = await addon.tab.waitForElement("[class*='selector_list-area']", {
    reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex !== 0 && !state.scratchGui.mode.isPlayerOnly,
  });
  setReactInternalKey(addon.tab.traps.getInternalKey(selectorListItem));
  const sortableHOCInstance = getSortableHOCFromElement(selectorListItem);
  verifySortableHOC(sortableHOCInstance, true);
  patchSortableHOC(sortableHOCInstance.constructor);
}
