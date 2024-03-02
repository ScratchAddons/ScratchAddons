export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm();

  let costumes;
  let sortedCostumes;

  function getCostumeOrder() {
    costumes = vm.editingTarget.getCostumes().map((costume) => costume.name);
    sortedCostumes = costumes.toSorted();
    console.log(`costumes: ${costumes}`);
    console.log(`sortedCostumes: ${sortedCostumes}`);
  }

  // Sort them using vm.editingTarget.reorderCostume
  vm.emitTargetsUpdate();
}
