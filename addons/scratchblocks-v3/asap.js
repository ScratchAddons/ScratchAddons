export default async ({ addon, global }) => {
  let onrender;
  global.onrender = new Promise(resolve => {
    onrender = resolve;
  });
  addon.tab.waitForElement("script[src$=\"scratchblocks.js\"]").then(e => {
    // WIP: writable isn't permitted
    // PLSEXPLAIN: Permission Locks Scratchblocks EXecution, Proper Loading After INjecting
    e.onload = () => {
      Object.defineProperty(scratchblocks, "renderMatching", {
        value: () => onrender(),
        writable: false,
        configurable: true,
      });
    };
  });
}