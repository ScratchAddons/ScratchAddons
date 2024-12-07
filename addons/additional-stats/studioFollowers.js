export default async function ({ addon, console, msg }) {
  let studio = await (await fetch(`https://api.scratch.mit.edu/studios/${addon.tab.redux.state.studio.id}`)).json();

  let timeSinceCreated = (Date.now() - Date.parse(studio.history.created)) / 86400000;
  timeSinceCreated = timeSinceCreated < 1 ? 1 : timeSinceCreated;

  const followersPerDay = studio.stats.followers / timeSinceCreated;

  let footerStats = document.getElementsByClassName("studio-info-footer-stats")[0];
  let followersPerDayStat = undefined;
  for (let i = 0; i < footerStats.children.length; i++) {
    const element = footerStats.children[i];
    if (element.getElementsByTagName("span")[0].textContent.includes("followers")) {
      followersPerDayStat = element.cloneNode(true);
    }
  }

  let followersPerDayStatText = followersPerDayStat.getElementsByTagName("span")[0];
  followersPerDayStatText.textContent = msg("followers-per-day", { followers: Math.round(followersPerDay) });
  addon.tab.displayNoneWhileDisabled(followersPerDayStat);
  footerStats.append(followersPerDayStat);
}
