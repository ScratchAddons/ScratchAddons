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
          
          // Find the 12-hour clock.
          let hour = dateCreated.getHours();
          let hourType = hour >= 12 ? 'pm' : 'am';
          hour = (hour % 12) || 12;
          element.setAttribute("title", msg("modified", { date: scratchAddons.l10n.date(dateMod) }) + msg("shared", { date: scratchAddons.l10n.date(dateCreated), hour: hour, minute: dateCreated.getMinutes(), hourType: hourType}));
        }
      }
    });
}
