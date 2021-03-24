export default async function ({ addon, global, console, msg }) {
  const data = await (
    await fetch("https://api.scratch.mit.edu" + location.pathname.match(/\/projects\/[0-9]+/g)[0])
  ).json();

  while (true) {
    const element = await addon.tab.waitForElement(".share-date", { markAsSeen: true });

    if (!data.history) return;

    let dateMod = scratchAddons.l10n.date(new Date(data.history.modified));
    let dateCreated = new Date(data.history.shared);
    let hour = dateCreated.getHours();
    let minute = (dateCreated.getMinutes() + "").padStart(2, "0");
    let dataTitle =
      msg("modified", { date: dateMod }) +
      msg("shared24", {
        date: scratchAddons.l10n.date(dateCreated),
        hour,
        minute,
      });
    if (addon.settings.get("12hrclock"))
      dataTitle =
        msg("modified", { date: dateMod }) +
        msg("shared", {
          date: scratchAddons.l10n.date(dateCreated),
          hour: hour % 12 || 12,
          minute,
          hourType: hour > 11 ? "pm" : "am",
        });

    element.setAttribute("title", dataTitle);
  }
}
