export default async function ({ addon, console }) {
  let subtitleBox;
  const createSubtitleBox = async () => {
    subtitleBox?.remove?.();
    if (
      addon.self.disabled ||
      (addon.tab.editorMode !== "projectpage" && addon.tab.editorMode !== "editor") ||
      (addon.tab.editorMode === "editor" && !addon.settings.get("show-in-editor"))
    ) {
      return null;
    }
    const player =
      addon.tab.editorMode === "projectpage"
        ? (await addon.tab.waitForElement(".guiPlayer")).parentElement
        : await addon.tab.waitForElement("[class^='stage-wrapper_stage-wrapper']");
    const box = document.createElement("div");
    box.classList.add("sa-tts-subtitles-box");
    player.insertAdjacentElement("afterend", box);
    subtitleBox = box;
  };
  addon.self.addEventListener("disabled", createSubtitleBox);
  addon.self.addEventListener("reenabled", createSubtitleBox);
  addon.settings.addEventListener("change", createSubtitleBox);
  addon.tab.addEventListener("urlChange", createSubtitleBox);
  createSubtitleBox();

  const addToSubtitlesBox = (text) => {
    if (!subtitleBox) {
      return;
    }
    subtitleBox.textContent += text + "\n";
    subtitleBox.scrollTop = subtitleBox.scrollHeight;
  };

  const oldRace = Promise.race;
  window.Promise.race = (args) => {
    const result = oldRace.bind(Promise)(args);
    result.then((result) => {
      if (!("url" in result && result.url.startsWith("https://synthesis-service.scratch.mit.edu/synth?"))) {
        return result;
      }
      const text = new URL(result.url).searchParams.get("text");
      addToSubtitlesBox(text);
    });
    return result;
  };
}
