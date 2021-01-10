export default class BlockItem {
  constructor(cls, procCode, labelID, y) {
    this.cls = cls;
    this.procCode = procCode;
    this.labelID = labelID;
    this.y = y;
    this.lower = procCode.toLowerCase();
    this.clones = null;
    this.eventName = null;
  }

  /**
   * True if the blockID matches a black represented by this BlockItem
   * @param id
   * @returns {boolean}
   */
  matchesID(id) {
    if (this.labelID === id) {
      return true;
    }
    if (this.clones) {
      for (const clone of this.clones) {
        if (clone.id === id) {
          return true;
        }
      }
    }
    return false;
  }
}
