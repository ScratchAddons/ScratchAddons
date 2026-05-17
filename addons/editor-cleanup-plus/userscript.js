import UndoGroup from "../../libraries/common/cs/UndoGroup.js";
import {
  getVariableUsesById,
  getOrderedTopBlockColumns,
  autoPositionComment,
} from "../../libraries/common/cs/devtools-utils.js";

// Gap between stacks when script-snap is not active (not constrained to grid size)
const NON_SNAP_GAP = 50;

export default async function ({ addon, console, msg, safeMsg: m }) {
  const blockly = await addon.tab.traps.getBlockly();

  const isScriptSnapEnabled = async () => {
    const enabledAddons = await addon.self.getEnabledAddons();
    return enabledAddons.includes("script-snap");
  };

  const originalMsg = blockly.Msg.CLEAN_UP;
  addon.self.addEventListener("disabled", () => (blockly.Msg.CLEAN_UP = originalMsg));
  addon.self.addEventListener("reenabled", () => (blockly.Msg.CLEAN_UP = m("clean-plus")));
  blockly.Msg.CLEAN_UP = m("clean-plus");

  const oldCleanUpFunc = blockly.WorkspaceSvg.prototype.cleanUp;
  blockly.WorkspaceSvg.prototype.cleanUp = function () {
    if (addon.self.disabled) return oldCleanUpFunc.call(this);
    void doCleanUp();
  };

  const doCleanUp = async () => {
    const workspace = addon.tab.traps.getWorkspace();
    const promptUnused = addon.settings.get("promptUnused");
    const scriptSnapEnabled = await isScriptSnapEnabled();

    UndoGroup.startUndoGroup(workspace);

    const result = getOrderedTopBlockColumns(true, workspace);
    const columns = result.cols;
    const orphanCount = result.orphans.blocks.length;
    if (orphanCount > 0) {
      const message = msg("orphaned", {
        count: orphanCount,
      });
      if (promptUnused && confirm(message)) {
        for (const block of result.orphans.blocks) {
          block.dispose();
        }
      } else {
        columns.unshift(result.orphans);
      }
    }

    const gridSize = workspace.getGrid().spacing || workspace.getGrid().spacing_; // new blockly || old blockly
    // Use a fixed pixel gap when script-snap is off; the grid-size gap was too large without snapping.
    const gap = scriptSnapEnabled ? gridSize : NON_SNAP_GAP;

    // When script-snap is active, coordinates start between workspace dots so snap aligns to them
    const startOffset = scriptSnapEnabled ? gridSize / 2 : 0;
    let cursorX = startOffset;

    const maxWidths = result.maxWidths;

    for (const column of columns) {
      let cursorY = startOffset;
      let maxWidth = 0;

      for (const block of column.blocks) {
        const xy = block.getRelativeToSurfaceXY();
        if (cursorX - xy.x !== 0 || cursorY - xy.y !== 0) {
          block.moveBy(cursorX - xy.x, cursorY - xy.y);
        }
        const heightWidth = block.getHeightWidth();
        cursorY += heightWidth.height + gap;
        // Only snap-round cursor positions when script-snap is active; otherwise gaps become grid-size multiples.
        if (scriptSnapEnabled) {
          cursorY += gridSize - ((cursorY + gridSize / 2) % gridSize);
        }

        const maxWidthWithComments = maxWidths[block.id] || 0;
        maxWidth = Math.max(maxWidth, Math.max(heightWidth.width, maxWidthWithComments));
      }

      cursorX += maxWidth + gap;
      if (scriptSnapEnabled) {
        cursorX += gridSize - ((cursorX + gridSize / 2) % gridSize);
      }
    }

    const topComments = workspace.getTopComments();
    for (const comment of topComments) {
      autoPositionComment(comment);
    }

    setTimeout(() => {
      if (promptUnused) promptUnusedVariables();
      UndoGroup.endUndoGroup(workspace);
    }, 100);
  };

  function promptUnusedVariables() {
    // Locate unused local variables...
    const workspace = addon.tab.traps.getWorkspace();
    const map = workspace.getVariableMap();
    const vars = map.getVariablesOfType("");
    const unusedLocals = [];

    for (const row of vars) {
      if (row.isLocal) {
        const usages = getVariableUsesById(row.getId(), workspace);
        if (!usages || usages.length === 0) {
          unusedLocals.push(row);
        }
      }
    }

    if (unusedLocals.length > 0) {
      const message = msg("unused-var", {
        count: unusedLocals.length,
        names: unusedLocals.map((x) => x.name).join(", "),
      });
      if (confirm(message)) {
        for (const orphan of unusedLocals) {
          if (blockly.registry) {
            // new Blockly
            workspace.getVariableMap().deleteVariable(orphan);
          } else {
            workspace.deleteVariableById(orphan.getId());
          }
        }
      }
    }

    // Locate unused local lists...
    const lists = map.getVariablesOfType("list");
    let unusedLists = [];

    for (const row of lists) {
      if (row.isLocal) {
        const usages = getVariableUsesById(row.getId(), workspace);
        if (!usages || usages.length === 0) {
          unusedLists.push(row);
        }
      }
    }
    if (unusedLists.length > 0) {
      let message = msg("unused-list", {
        count: unusedLists.length,
        names: unusedLists.map((x) => x.name).join(", "),
      });
      if (confirm(message)) {
        for (const orphan of unusedLists) {
          if (blockly.registry) {
            // new Blockly
            workspace.getVariableMap().deleteVariable(orphan);
          } else {
            workspace.deleteVariableById(orphan.getId());
          }
        }
      }
    }
  }
}
