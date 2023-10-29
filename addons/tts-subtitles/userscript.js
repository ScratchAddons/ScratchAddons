export default async function ({ addon, console }) {
  let subtitleBox;
  const createSubtitleBox = async () => {
    if (addon.tab.editorMode !== "projectpage" && addon.tab.editorMode !== "editor") {
      return null;
    }
    const player =
      addon.tab.editorMode === "projectpage"
        ? (await addon.tab.waitForElement(".guiPlayer")).parentElement
        : await addon.tab.waitForElement("[class^='stage-wrapper_stage-wrapper']");
    const box = document.createElement("div");
    box.classList.add("sa-tts-subtitles-box");
    player.insertAdjacentElement("afterend", box);
    return box;
  };
  addon.tab.addEventListener("urlChange", async () => {
    subtitleBox = await createSubtitleBox();
  });
  subtitleBox = await createSubtitleBox();

  const addToSubtitlesBox = (text) => {
    if (!subtitleBox) {
      return;
    }
    subtitleBox.textContent += text + "\n";
    subtitleBox.scrollTop = subtitleBox.scrollHeight;
  };

  // It needs to be on window.Promise for some reason
  // Otherwise, there's an error that when googled yields zero results
  window.Promise._race = Promise.race;
  window.Promise.race = async (args) => {
    const result = await Promise._race(args);
    if (!("url" in result && result.url.startsWith("https://synthesis-service.scratch.mit.edu/synth?"))) {
      return result;
    }
    const text = new URL(result.url).searchParams.get("text");
    addToSubtitlesBox(text);
    return result;
  };
}
