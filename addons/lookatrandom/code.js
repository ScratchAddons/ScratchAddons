export default async function ({ addon, global, console }) {
  const vm = addon.tab.traps.vm;
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const oldInit = ScratchBlocks.Blocks.motion_pointtowards_menu.init;
  ScratchBlocks.Blocks.motion_pointtowards_menu.init = function () {
    if (!addon.self.disabled) {
      ScratchBlocks.Blocks.motion_pointtowards_menu.init = function () {
        this.jsonInit({
          message0: "%1",
          args0: [
            {
              type: "field_dropdown",
              name: "TOWARDS",
              options: [
                [ScratchBlocks.Msg.MOTION_POINTTOWARDS_POINTER, "_mouse_"],
                [ScratchBlocks.Msg.MOTION_POINTTOWARDS_RANDOM, "_random_"],
              ],
            },
          ],
          colour: ScratchBlocks.Colours.motion.secondary,
          colourSecondary: ScratchBlocks.Colours.motion.secondary,
          colourTertiary: ScratchBlocks.Colours.motion.tertiary,
          extensions: ["output_string"],
        });
      };
    } else {
      oldInit.call(this);
    }
  };
  this.jsonInit({
    message0: "%1",
    args0: [
      {
        type: "field_dropdown",
        name: "TOWARDS",
        options: [
          [ScratchBlocks.Msg.MOTION_POINTTOWARDS_POINTER, "_mouse_"],
          [ScratchBlocks.Msg.MOTION_POINTTOWARDS_RANDOM, "_random_"],
          spriteMenu(),
        ],
      },
    ],
    colour: ScratchBlocks.Colours.motion.secondary,
    colourSecondary: ScratchBlocks.Colours.motion.secondary,
    colourTertiary: ScratchBlocks.Colours.motion.tertiary,
    extensions: ["output_string"],
  });
}
