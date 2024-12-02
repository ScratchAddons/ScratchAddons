export default async function ({ addon, console, msg }) {
    let studio = await (await fetch(`https://api.scratch.mit.edu/studios/${addon.tab.redux.state.studio.id}`)).json();

    const timeSinceCreated = (Date.now() - Date.parse(studio.history.created)) / 86400000;
    const followersPerDay = studio.stats.followers / timeSinceCreated;

    let footerStats = document.getElementsByClassName("studio-info-footer-stats")[0];
    let followersPerDayStat = document.createElement("div");
    followersPerDayStat.innerHTML = footerStats.children[2].innerHTML

    let followersPerDayStatText = followersPerDayStat.getElementsByTagName("span")[0];
    followersPerDayStatText.innerHTML = msg("followers-per-day", {"followers": Math.round(followersPerDay)});
    footerStats.append(followersPerDayStat);
  }
