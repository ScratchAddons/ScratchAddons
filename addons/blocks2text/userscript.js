export default async function ({ addon, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();

  const imageNames = {
    "green-flag": "@greenFlag",
    "rotate-left": "@turnLeft",
    "rotate-right": "@turnRight",
  };

  function escapeText(text) {
    // Add backslash escape before parentheses
    return text.replace(/([()[\]{}])/g, "\\$1");
  }

  function serializeBlock(block) {
    if (!block) {
      return "";
    }

    if (block.type === "text") {
      return `[${escapeText(block.getFieldValue("TEXT"))}]`;
    } else if (block.type === "math_number") {
      return `(${block.getFieldValue("NUM")})`;
    } else if (block.type === "data_variable") {
      const variableName = escapeText(block.inputList[0].fieldRow[0].getText());
      return `(${variableName} :: variables)`;
    }

    let text = "";
    let isCBlock = false;

    for (const input of block.inputList) {
      for (const field of input.fieldRow) {
        if (field instanceof Blockly.FieldImage) {
          const imageId = field.src_.split("/").pop().split(".")[0];
          if (imageNames[imageId]) {
            text += imageNames[imageId] + " ";
          }
        } else {
          let fieldText = escapeText(field.getText());
          if (["dropdown", "variable"].includes(field.getArgTypes())) {
            fieldText += " v";
            if (!block.isShadow()) {
              fieldText = `[${fieldText}]`;
            }
          }
          text += fieldText + " ";
        }
      }
      const connection = input.connection;
      if (connection) {
        const targetBlock = connection.targetBlock();
        if (targetBlock) {
          if (connection.type === Blockly.NEXT_STATEMENT && block.type !== "procedures_definition") {
            isCBlock = true;
            let child = serializeBlock(targetBlock);
            child = child
              .split("\n")
              .map((l) => (l.trim() ? "  " + l : l))
              .join("\n")
              .replace(/\s+$/, "");
            text += "\n" + child + "\n";
          } else {
            text += serializeBlock(targetBlock) + " ";
          }
        } else {
          if (connection.type === Blockly.NEXT_STATEMENT) {
            isCBlock = true;
            text += "\n\n";
          } else if (connection.getOutputShape() === 1) {
            text += "<> ";
          }
        }
      }
    }
    text = text.trim();
    if (block.type.startsWith("argument_reporter_")) {
      text += " :: custom-arg";
    }
    switch (block.getOutputShape()) {
      case Blockly.OUTPUT_SHAPE_HEXAGONAL:
        text = `<${text}>`;
        break;
      case Blockly.OUTPUT_SHAPE_ROUND:
        text = `(${text})`;
        break;
      default:
        text = `${text}\n`;
        if (isCBlock) {
          text += `end\n`;
        }
        break;
    }
    const nextBlock = block.getNextBlock();
    if (nextBlock) {
      text += serializeBlock(nextBlock);
    }
    return text;
  }

  function serializeWorkspaceStacks() {
    let workspace;
    try {
      workspace = addon.tab.traps.getWorkspace();
    } catch (e) {
      console.warn("serializeWorkspaceStacks: unable to get workspace", e);
      return "";
    }
    if (!workspace) return "";
    let topBlocks = [];
    try {
      topBlocks = workspace.getTopBlocks();
    } catch (e) {
      console.warn("serializeWorkspaceStacks: getTopBlocks failed", e);
      return "";
    }
    const parts = [];
    for (const block of topBlocks) {
      try {
        const serialized = serializeBlock(block).trimEnd();
        if (serialized) parts.push(serialized);
      } catch (e) {
        console.error("serializeWorkspaceStacks: block serialization failed", block?.type, e);
      }
    }
    return parts.join("\n\n").trim();
  }

  function copyText(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch((e) => console.warn("Copy failed", e));
  }

  function handleCopyBlock(block) {
    try {
      let text = serializeBlock(block).trim();
      copyText(text);
    } catch (e) {
      console.error("Block serialization failed", e);
    }
  }

  function handleCopyWorkspace() {
    try {
      copyText(serializeWorkspaceStacks());
    } catch (e) {
      console.error("Workspace serialization failed", e);
    }
  }

  if (Blockly.registry) {
    const registerSeparator = () => {
      Blockly.ContextMenuRegistry.registry.register({
        separator: true,
        scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
        id: "saCopyAllAsTextSeparator",
        weight: 9,
      });
    };
    const unregisterSeparator = () => {
      Blockly.ContextMenuRegistry.registry.unregister("saCopyAllAsTextSeparator");
    };
    registerSeparator();
    addon.self.addEventListener("disabled", unregisterSeparator);
    addon.self.addEventListener("reenabled", registerSeparator);

    Blockly.ContextMenuRegistry.registry.register({
      displayText: msg("copyAll"),
      preconditionFn: () => {
        if (addon.self.disabled) return "hidden";
        if (document.querySelector("svg.blocklySvg g.blocklyBlockCanvas > g.blocklyBlock")) return "enabled";
        return "disabled";
      },
      callback: () => handleCopyWorkspace(),
      scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
      id: "saCopyAllAsText",
      weight: 10,
    });
  } else {
    addon.tab.createBlockContextMenu(
      (items) => {
        if (addon.self.disabled) return items;
        let svgchild = document.querySelector("svg.blocklySvg g.blocklyBlockCanvas");
        const pasteItemIndex = items.findIndex((obj) => obj._isDevtoolsFirstItem);
        const insertBeforeIndex = pasteItemIndex !== -1 ? pasteItemIndex : items.length;
        items.splice(insertBeforeIndex, 0, {
          enabled: !!svgchild?.childNodes?.length,
            text: msg("copyAll"),
            callback: () => handleCopyWorkspace(),
        });
        items.splice(insertBeforeIndex, 0, { separator: true });
        return items;
      },
      { workspace: true }
    );
  }

  addon.tab.createBlockContextMenu(
    (items, block) => {
      if (addon.self.disabled) return items;
      const makeSpaceItemIndex = items.findIndex((obj) => obj._isDevtoolsFirstItem);
      const insertBeforeIndex = makeSpaceItemIndex !== -1 ? makeSpaceItemIndex : items.length;
      items.splice(insertBeforeIndex, 0, {
        enabled: true,
        text: msg("copy"),
        callback: () => handleCopyBlock(block),
      });
      items.splice(insertBeforeIndex, 0, { separator: true });
      return items;
    },
    { blocks: true }
  );
}
