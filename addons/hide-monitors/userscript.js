export default async function ({ addon, msg, console }) {
  let monitorsShown = true;
  const monitorWrapper = () => {
    return document.querySelector('[class^="stage_monitor-wrapper_"]');
  };
  await addon.tab.waitForElement('div[class^="stage-header_stage-size-row"]');

  const monitorsButton = document.createElement("button");
  monitorsButton.textContent = msg("hide-monitors");
  monitorsButton.title = msg("hide-monitors");
  monitorsButton.addEventListener("click", () => {
    monitorWrapper().classList.toggle("sa-hide-monitors");
    monitorsShown = !monitorsShown;
  });

  const preventClicks = (e) => {
    if (e.target.closest('[class^="stage_monitor-wrapper_"]') && !monitorsShown) {
      e.stopImmediatePropagation();
    }
  };

  document.body.addEventListener("mousedown", preventClicks);
  document.body.addEventListener("click", preventClicks);

  const update = () => {
    addon.tab.appendToSharedSpace({
      space: "afterStopButton",
      element: monitorsButton,
      order: 3,
    });

    if (!monitorsShown) {
      monitorWrapper().classList.add("sa-hide-monitors");
    }
  };

  addon.tab.addEventListener("urlChange", update);
  update();
}
