export default async function ({ addon, msg, global, console }) {
  while (true) {
    const dial = await addon.tab.waitForElement("[class^=dial_container]", { markAsSeen: true });
    const key = addon.tab.traps.getInternalKey(dial);
    const originalDir = dial[key].return.stateNode.directionToMouseEvent;
    dial[key].return.stateNode.directionToMouseEvent = function (e) {
      const old = originalDir.call(this, e);
      return e.shiftKey ? Math.round((old + this.directionOffset) / 45) * 45 - this.directionOffset : old;
    };
  }
}
