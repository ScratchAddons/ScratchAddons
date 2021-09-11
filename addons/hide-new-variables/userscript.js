export default async function ({ addon, msg, global, console }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const originalSetCheckboxState = ScratchBlocks.VerticalFlyout.prototype.setCheckboxState;
  ScratchBlocks.VerticalFlyout.prototype.setCheckboxState = function (...args) {
    // This method is called here: https://github.com/LLK/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/variables.js#L331
    // When a prompt like the "New variable" prompt is open, just don't do anything
    // Scratch does have other types of prompts, but you can't create variables while those are open, so this is safe.
    if (!addon.self.disabled && document.querySelector('[class*="prompt_modal-content_"]')) {
      return;
    }
    return originalSetCheckboxState.call(this, ...args);
  };
}
