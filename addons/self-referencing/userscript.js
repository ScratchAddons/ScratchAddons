export default async function ({ addon, global, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();
  const vm = addon.tab.traps.vm;
  //Most of this code was derived from GarboMuffin's "searchable dropdowns" addon
  const oldFieldDropdownGetOptions = Blockly.FieldDropdown.prototype.getOptions;
  Blockly.FieldDropdown.prototype.getOptions = function () {
    const options = oldFieldDropdownGetOptions.call(this);
    const block = this.sourceBlock_;
    if(vm.editingTarget.isStage) return options;
    const name = vm.editingTarget.sprite.name;
    if (block) {
      if (block.type === "sensing_touchingobjectmenu" || block.type === "sensing_of_object_menu" || block.type === "sensing_distancetomenu") {
        options.push(["myself",name]); //Adds the "myself" option to the blocks listed above
      }
    }
    return options;
  };
}
