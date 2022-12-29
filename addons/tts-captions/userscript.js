import createLogView from "../debugger/log-view.js";
export default async function ({ addon, console }) {
  console.log("sanity check");
  const vm = addon.tab.traps.vm;
  const logView = new createLogView();
  console.log(logView);
  logView.placeholderElement.textContent = "no logs";

  logView.generateRow = (row) => {
    const root = document.createElement("div");
    root.className = "sa-debugger-log";

    const icon = document.createElement("div");
    icon.className = "sa-debugger-log-icon";
    root.appendChild(icon);

    const repeats = document.createElement("div");
    repeats.className = "sa-debugger-log-repeats";
    repeats.style.display = "none";
    root.appendChild(repeats);

    const text = document.createElement("div");
    text.className = "sa-debugger-log-text";
    if (row.length === 0) {
      text.classList.add("sa-debugger-log-text-empty");
      text.textContent = msg("empty-string");
    } else {
      text.textContent = row;
      text.title = row;
    }
    root.appendChild(text);

    if (row.targetInfo && row.blockId) {
      root.appendChild(debug.createBlockLink(row.targetInfo, row.blockId));
    }

    return {
      root,
      repeats,
    };
  };

  logView.renderRow = (elements, row) => {
    /*const { repeats } = elements;
    if (row.count > 1) {
      repeats.style.display = "";
      repeats.textContent = row.count;
    }*/
  };
  window.vm = vm;
 const init = () => {
        const oldSpeakAndWait = vm.runtime._primitives.text2speech_speakAndWait;
    vm.runtime._primitives.text2speech_speakAndWait = function (args, util) {
      const text = args.WORDS;
      console.log(text);
      logView.append(`[${util.target.sprite.name}] ${text}`);
      logView.queueUpdateContent();
      return oldSpeakAndWait.call(this, args, util);
    };
    vm.runtime.targets.forEach((targ) => targ.blocks.resetCache());
 }
  vm.on("RUNTIME_STARTED", init);
  vm.on("PROJECT_START", init)

  while (true) {
    const location = await addon.tab.waitForElement(".inner > div:nth-child(2)", { markAsSeen: true });

    const wrapper = document.createElement("div");
    wrapper.className = "sa-tts-captions-wrapper";
    wrapper.appendChild(logView.outerElement);
    location.after(wrapper);
    logView.show();
  }
}
