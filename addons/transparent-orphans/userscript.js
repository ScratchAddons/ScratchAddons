export default async function ({ addon, console }) {
  let blockly = await addon.tab.traps.getBlockly();

  let transparentBlocks = [];

  function setTransparency(block, t) {
    let current = block;

    current.setOpacity(t);

    for (let child of current.getChildren()) {
      setTransparency(child, t);
    }

    for (let input of current.inputList) {
      for (let dropdown of input.fieldRow.filter((d) => d.argType_ && d.box_)) {
        dropdown.box_.style.fillOpacity = t;
      }

      if (input.type === 1 && input.outlinePath) {
        input.outlinePath.style.fillOpacity = t;
      }
    }

    while (current.getNextBlock()) {
      current = current.getNextBlock();

      current.setOpacity(t);

      for (let child of current.getChildren()) {
        setTransparency(child, t);
      }

      for (let input of current.inputList) {
        for (let dropdown of input.fieldRow.filter((d) => d.argType_)) {
          dropdown.box_.style.fillOpacity = t;
        }

        if (input.type === 1) {
          input.outlinePath.style.fillOpacity = t;
        }
      }
    }
  }

  function onchange(e) {
    if (e.type !== "move" && e.type !== "create") return;

    let orphans = blockly
      .getMainWorkspace()
      .getTopBlocks()
      .filter(
        (block) =>
          (!!block.previousConnection && !block.previousConnection.targetConnection) || !!block.outputConnection
      );
    let orphanids = orphans.map((block) => block.id);

    for (let transparentBlock of transparentBlocks) {
      if (!orphanids.includes(transparentBlock)) {
        let block = blockly.getMainWorkspace().getBlockById(transparentBlock);

        if (!block) continue;

        block.svgGroup_.querySelectorAll("text").forEach(text => text.style.opacity = 1);

        setTransparency(block, 1);
      }
    }

    transparentBlocks = [];

    for (const orphan of orphans) {
      transparentBlocks.push(orphan.id);

      setTransparency(orphan, addon.settings.get("transparency") / 100);

      orphan.svgGroup_.querySelectorAll("text").forEach(text => text.style.opacity = addon.settings.get("transparency") / 100);
    }
  }

  blockly.getMainWorkspace().addChangeListener(onchange);

  addon.settings.addEventListener("change", () => onchange({ type: "move" }));
}
