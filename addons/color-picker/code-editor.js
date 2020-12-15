export default async ({addon, console}) => {
  let elem;
  while (true) {
    elem = await addon.tab.waitForElement("button.scratchEyedropper", {markAsSeen: true});
    if (addon.tab.editorMode !== "editor") continue;
    console.log("code editor color picker:", elem);
  }
};