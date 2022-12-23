export default async function ({ addon, global, cons, msg }) {
    const ScratchBlocks = await addon.tab.traps.getBlockly();

    let defaultMenu = null;
    function appendRandomOption(menuOptions) {
        if (!defaultMenu) {
            defaultMenu = [...menuOptions];
        }
        if (!addon.self.disabled) {
            menuOptions.push([ScratchBlocks.Msg.MOTION_POINTTOWARDS_RANDOM, "_random_"])
        }
        return menuOptions;
    }

    const block = ScratchBlocks.Blocks["motion_pointtowards_menu"];
    const originalInit = block.init;
    block.init = function (...args) {
        const originalJsonInit = this.jsonInit;
        this.jsonInit = function (obj) {
            const originalOptionsMenu = obj.args0[0].options;
            obj.args0[0].options = function(...args) {
                return appendRandomOption(originalOptionsMenu.call(this, ...args));
            }
            return originalJsonInit.call(this, obj);
        };
        return originalInit.call(this, ...args);
    };

    const updateExistingBlocks = () => {
        const workspace = Blockly.getMainWorkspace();
        const flyout = workspace && workspace.getFlyout();
        if (workspace && flyout) {
            const allBlocks = [...workspace.getAllBlocks(), ...flyout.getWorkspace().getAllBlocks()];
            for (const block of allBlocks) {
                if (block.type !== "motion_pointtowards_menu") {
                    continue;
                }
                const input = block.inputList[0];
                if (!input) {
                    continue;
                }
                const field = input.fieldRow.find((i) => i && Array.isArray(i.menuGenerator_));
                if (!field) {
                    continue;
                }
                field.menuGenerator_ = appendRandomOption(
                    defaultMenu ? [...defaultMenu] : field.menuGenerator_
                );
            }
        }
    };

    updateExistingBlocks();
    addon.settings.addEventListener("change", updateExistingBlocks);
    addon.self.addEventListener("disabled", updateExistingBlocks);
    addon.self.addEventListener("reenabled", updateExistingBlocks);
}