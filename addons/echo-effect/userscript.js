import { updateTooltips } from "../editor-compact/force-tooltip-update.js";

export default async ({ addon }) => {
  while (true) {
    const soundEditorRobot = await addon.tab.waitForElement('[class*="sound-editor_row-reverse_"] > :nth-child(10)', {
      markAsSeen: true,
    });
    const echoButton = document.createElement("div");
    echoButton.className = addon.tab.scratchClass("icon-button_container", "sound-editor_effect-button");
    addon.tab.displayNoneWhileDisabled(echoButton, {
      display: "flex",
    });
    echoButton.setAttribute("role", "button");
    echoButton.addEventListener("click", () => {
      const soundEditorContainer = soundEditorRobot.closest('[class*="sound-editor_editor-container_"]');
      soundEditorContainer[
        addon.tab.traps.getInternalKey(soundEditorContainer)
      ].return.return.return.stateNode.handleEffect("echo");
    });
    const echoIcon = Object.assign(document.createElement("img"), {
      src: addon.self.dir + "/echo.svg",
      draggable: false,
    });
    const echoTitleWrapper = Object.assign(document.createElement("div"), {
      className: addon.tab.scratchClass("icon-button_title"),
    });
    const echoTitle = Object.assign(document.createElement("span"), {
      textContent: addon.tab.scratchMessage("gui.soundEditor.echo"),
    });
    echoTitleWrapper.append(echoTitle);
    echoButton.append(echoIcon, echoTitleWrapper);
    soundEditorRobot.after(echoButton);
    updateTooltips();
  }
};
