export default async function ({ addon, console }) {
  const COSTUME_BLOCKS = {
    looks_switchcostumeto: {},
    looks_switchbackdropto: { cutThree: true },
    looks_switchbackdroptoandwait: { cutThree: true },
    event_whenbackdropswitchesto: {},
  };

  const Blockly = await addon.tab.traps.getBlockly();

  async function showCostumeNumbers() {
    const workspace = await addon.tab.traps.getWorkspace();
    const block = workspace.getBlockById(document.querySelector(".blocklySelected").dataset.id);
    if (block.type in COSTUME_BLOCKS) {
      const dropDownContent = Blockly.DropDownDiv.getContentDiv();
      dropDownContent.classList.add("sa-dropdown-costume-numbers");
      const allItems = dropDownContent.querySelectorAll("[role='menuitemcheckbox']");
      // Exclude previous/next/random backdrop
      const { cutThree } = COSTUME_BLOCKS[block.type];
      const limit = allItems.length - !!cutThree * 3;
      for (let i = 0; i < limit; i++) {
        allItems[i].lastChild.dataset.index = i + 1;
      }
    }
  }
  const oldDropDownDivShow = Blockly.DropDownDiv.show;
  Blockly.DropDownDiv.show = function (...args) {
    oldDropDownDivShow.call(this, ...args);
    showCostumeNumbers();
  };
  const oldDropDownDivClearContent = Blockly.DropDownDiv.clearContent;
  Blockly.DropDownDiv.clearContent = function () {
    oldDropDownDivClearContent.call(this);
  };
}
