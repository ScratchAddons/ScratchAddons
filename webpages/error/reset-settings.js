import resetSettings from "../../libraries/common/reset-settings.js";
document.querySelector("#reset-settings-btn").onclick = () => {
  // TODO: if (!window.exportedSettings) after error page gets an "export settings" button.
  resetSettings();
};
