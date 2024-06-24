export default function updateToolboxXML(tab) {
  const blocksWrapper = document.querySelector("[class*='gui_blocks-wrapper_']");
  if (blocksWrapper) {
    let instance = blocksWrapper[tab.traps.getInternalKey()];
    while (!instance.stateNode?.ScratchBlocks) instance = instance.child;
    const blocksComponent = instance.stateNode;
    const toolboxXML = blocksComponent.getToolboxXML();
    if (toolboxXML) {
      tab.redux.dispatch({
        type: "scratch-gui/toolbox/UPDATE_TOOLBOX",
        toolboxXML,
      });
    }
  }
}
