export default async function ({ addon, console }) {
  const textarea = await addon.tab.waitForElement(".markItUpEditor");
  const previewButton = await addon.tab.waitForElement(".markItUpButton.preview");
  let previewIframe;
  let delay;
  switch (addon.settings.get("rate")) {
    case "slow":
      delay = 2500;
      break;
    case "fast":
      delay = 250;
      break;
    default:
      delay = 1000;
  }
  addon.tab.waitForElement(".markItUpPreviewFrame").then((iframe) => (previewIframe = iframe));

  const showPreview = () => {
    if (previewIframe) previewIframe.style.removeProperty("display");
  };
  const hidePreview = () => {
    if (previewIframe) previewIframe.style.display = "none";
  };
  const updatePreview = () => {
    if (addon.self.disabled) return;
    previewButton.dispatchEvent(new MouseEvent("mousedown"));
    if (textarea.value) {
      showPreview();
    } else {
      hidePreview();
    }
  };

  let timeout;
  textarea.addEventListener("input", () => {
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = setTimeout(updatePreview, delay);
  });
  addon.self.addEventListener("disabled", () => {
    showPreview();
  });

  if (addon.self.enabledLate) updatePreview();
}
