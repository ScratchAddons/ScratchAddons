export default async function ({ addon, console, msg }) {
    let studio = await (await fetch(`https://api.scratch.mit.edu/studios/${addon.tab.redux.state.studio.id}`)).json();

    const dateCreatedText = new Date(studio.history.created).toLocaleString(msg.locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    let footerStats = document.getElementsByClassName("studio-info-footer-stats")[0];
    let dateCreatedStat = document.createElement("div");
    dateCreatedStat.innerHTML = footerStats.children[0].innerHTML;

    let dateCreatedStatText = dateCreatedStat.getElementsByTagName("span")[0];
    dateCreatedStatText.innerHTML = msg("date-created", { date: dateCreatedText });
    footerStats.prepend(dateCreatedStat);
  }
