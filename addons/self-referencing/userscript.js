export default async function ({ addon, global, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;
  const SUPPORTED_BLOCKS = [
    "sensing_touchingobjectmenu",
    "sensing_of_object_menu",
    "sensing_distancetomenu",
    "motion_pointtowards_menu",
    "motion_goto_menu",
    "motion_glideto_menu"
  ];
  //Most of this code was derived from GarboMuffin's "searchable dropdowns" addon
  const oldFieldDropdownGetOptions = Blockly.FieldDropdown.prototype.getOptions;
  Blockly.FieldDropdown.prototype.getOptions = function () {
    const options = oldFieldDropdownGetOptions.call(this);
    const block = this.sourceBlock_;
    if(vm.editingTarget.isStage) return options;
    const name = vm.editingTarget.sprite.name;
    if (block) {
      if (SUPPORTED_BLOCKS.includes(block.type)) {
        options.push([name,name]); //Adds the "myself" option to the blocks listed above
      }
    }
    return options;
  };
}
