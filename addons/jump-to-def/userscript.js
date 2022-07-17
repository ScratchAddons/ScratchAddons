import Utils from "../find-bar/blockly/Utils.js";
export default async function ({ addon, msg, global, console }) {
  const utils = new Utils(addon);

  document.addEventListener(
    "mousedown",
    (e) => {
      if (!addon.self.disabled && (e.button === 1 || e.shiftKey)) {
        // Intercept clicks to allow jump to...?
        let blockSvg = e.target.closest("[data-id]");
        if (!blockSvg) {
          return;
        }

        let workspace = utils.getWorkspace();
        let dataId = blockSvg.getAttribute("data-id");
        let block = workspace.getBlockById(dataId);
        if (!block) {
          return;
        }

        for (; block; block = block.getSurroundParent()) {
          if (block.type === "procedures_call") {
            e.cancelBubble = true;
            e.preventDefault();

            let findProcCode = block.getProcCode();

            let topBlocks = workspace.getTopBlocks();
            for (const root of topBlocks) {
              if (root.type === "procedures_definition") {
                let label = root.getChildren()[0];
                let procCode = label.getProcCode();
                if (procCode && procCode === findProcCode) {
                  // Found... navigate to it!
                  utils.scrollBlockIntoView(root);
                  return;
                }
              }
            }
          }
        }
      }
    },
    true
  );
}
