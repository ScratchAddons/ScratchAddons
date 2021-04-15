export default async function ({ addon, global, console, msg }) {
  const path = location.pathname.match(/\/projects\/[0-9]+/g);
  // Return if there is no project id... for example, if the user visits
  // scratch.mit.edu/projects/editor/?tutorial=getStarted
  if (!path.length) return;
  const data = await (await fetch("https://api.scratch.mit.edu" + path[0])).json();

  while (true) {
    const element = await addon.tab.waitForElement(".share-date", { markAsSeen: true });

    if (!data.history) return;

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
