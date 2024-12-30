/**
 * Helper class to flash a Blockly scratch block in the users workspace
 */
export default class BlockFlasher {
  /**
   * FLash a block 3 times
   * @param block the block to flash
   */
  static flash(block) {
    const getSvgPath = (block) => {
      if (!block) return null;
      if (block.pathObject) return block.pathObject.svgPath; // new Blockly
      return block.svgPath_;
    };

    if (myFlash.timerID > 0) {
      clearTimeout(myFlash.timerID);
      if (getSvgPath(myFlash.block)) {
        getSvgPath(myFlash.block).style.fill = "";
      }
    }

    let count = 4;
    let flashOn = true;
    myFlash.block = block;

    /**
     * Internal method to switch the colour of a block between light yellow and it's original colour
     * @private
     */
    function _flash() {
      if (getSvgPath(myFlash.block)) {
        getSvgPath(myFlash.block).style.fill = flashOn ? "#ffff80" : "";
      }
      flashOn = !flashOn;
      count--;
      if (count > 0) {
        myFlash.timerID = setTimeout(_flash, 200);
      } else {
        myFlash.timerID = 0;
        myFlash.block = null;
      }
    }

    _flash();
  }
}

const myFlash = { block: null, timerID: null };
