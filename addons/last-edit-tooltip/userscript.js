export default async function ({ addon, global, console, msg }) {
  let { redux } = addon.tab;

  await redux.waitForState((state) => state.preview.status.project === "FETCHED", {
    actions: ["SET_INFO"],
  });

  let data = redux.state.preview.projectInfo;

  if (!data.history) return;

  while (true) {
    const element = await addon.tab.waitForElement(".share-date", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });

    // Using this instead of scratchAddons.l10n.locales
    // to avoid confusion between DD/MM/YYYY and MM/DD/YYYY.
    // This will use AM/PM for all English users, even en-GB
    const dateFormatterWithMonthName = new Intl.DateTimeFormat(msg.locale, {
      timeStyle: "short",
      dateStyle: "medium",
    });
    let dateMod = data.history.modified ? dateFormatterWithMonthName.format(new Date(data.history.modified)) : "?";
    let dateShared = data.history.shared ? dateFormatterWithMonthName.format(new Date(data.history.shared)) : "?";
    let dataTitle = `${msg("shared", { date: dateShared })}
${msg("modified", { date: dateMod })}`;
    element.setAttribute("title", dataTitle);
  }
}
