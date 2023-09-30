export default async function ({ addon, console }) {
  // The boolean value is for whether the last three items should not have a number - e.g. for the "next background", "previous background" etc
  const COSTUME_BLOCKS = {
    looks_switchcostumeto: false,
    looks_switchbackdropto: true,
    looks_switchbackdroptoandwait: true,
  };

  const dropDownDiv = await addon.tab.waitForElement(".blocklyDropDownDiv");
  const workspace = await addon.tab.traps.getWorkspace();

  // This will show the original text without the numbers for a bit.
  // I'm not aware of any better way to detect dropdown close, though
  const waitForDropdownClose = () => {
    const currentStyle = dropDownDiv.getAttribute("style");
    return new Promise((resolve) =>
      setInterval(() => {
        if (currentStyle !== dropDownDiv.getAttribute("style")) resolve();
      }, 100)
    );
  };

  while (true) {
    const element = await addon.tab.waitForElement(".blocklySelected");
    const block = workspace.getBlockById(element.dataset.id);
    if (block.type in COSTUME_BLOCKS) {
      dropDownDiv.classList.add("sa-dropdown-costume-numbers");
      const allItems = [...dropDownDiv.querySelectorAll(".goog-menuitem")];
      const cutThree = COSTUME_BLOCKS[block.type];
      allItems.forEach((el, i) => {
        if (cutThree && i >= allItems.length - 3) return;
        el.lastChild.dataset.index = i + 1;
      });
    } else {
      dropDownDiv.classList.remove("sa-dropdown-costume-numbers");
    }
    await waitForDropdownClose();
  }
}
