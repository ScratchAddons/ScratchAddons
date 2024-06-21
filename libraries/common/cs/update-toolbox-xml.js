export default function updateToolboxXML(tab) {
  tab.waitForElement("[class*='gui_blocks-wrapper_']").then((blocksWrapper) => {
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
  });
}
