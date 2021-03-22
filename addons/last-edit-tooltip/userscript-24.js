export default async function ({ addon, global, console, msg }) {
  fetch("https://api.scratch.mit.edu" + document.location.pathname)
    .then(function (response) {
      return response.json();
    })
    .then(async function (text) {
      while (true) {
        const element = await addon.tab.waitForElement(".share-date", { markAsSeen: true });
        if (text.history) {
          let dateMod = new Date(text.history.modified);
          let dateCreated = new Date(text.history.shared);

          element.setAttribute(
            "title",
            msg("modified", { date: scratchAddons.l10n.date(dateMod) }) +
              msg("shared24", {
                date: scratchAddons.l10n.date(dateCreated),
                hour: dateCreated.getHours(),
                minute: dateCreated.getMinutes(),
              })
          );
        }
      }
    });
}
