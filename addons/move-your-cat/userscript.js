export default async ({ addon, console }) => {
  const FLAG = "🏳";
  const INDENT = "    ";
  window.thatAddon = addon;
  const moveCatScript = [
    (Msg) => Msg.EVENT_WHENFLAGCLICKED.replace("%1", FLAG),
    (Msg) => Msg.MOTION_SETROTATIONSTYLE.replace("%1", `[${Msg.MOTION_SETROTATIONSTYLE_LEFTRIGHT} v]`),
    (Msg) => Msg.CONTROL_FOREVER,
    (Msg) => INDENT + Msg.MOTION_MOVESTEPS.replace("%1", "(10)"),
    (Msg) => INDENT + Msg.MOTION_IFONEDGEBOUNCE,
    (Msg) => INDENT + Msg.LOOKS_NEXTCOSTUME,
  ];
  addon.tab.addEventListener("fakestatechanged", (e) => {
    if (e.reducerOrigin !== "locale" || e.path[0] !== "locale") return;
    if (typeof e.prev === "undefined") return;
    if (e.prev === e.next) return;
    const vm = addon.tab.traps.onceValues.vm;
    const ScratchBlocks = addon.tab.traps.onceValues.ScratchBlocks;
    if (!vm || !ScratchBlocks) return;
    vm.once("workspaceUpdate", () => {
      console.log("Your locale is now: ", e.next);
      console.log("Here is how to move your cat:");
      moveCatScript.forEach((fn) => console.log(fn(ScratchBlocks.Msg)));
    });
  });
};
