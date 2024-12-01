export default async function ({ addon, console, msg }) {
    while (addon.tab.redux.state.preview.projectInfo.id == undefined) {}

    let project = await (
      await fetch(`https://api.scratch.mit.edu/projects/${addon.tab.redux.state.preview.projectInfo.id}`)
    ).json();

    const dateCreatedText = new Date(project.history.created).toLocaleString(msg.locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const dateModifiedText = new Date(project.history.modified).toLocaleString(msg.locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    let dateStats = document.getElementsByClassName("subactions")[0];
    let end = dateStats.children[1];

    let dateCreatedStat = document.createElement("span");
    dateCreatedStat.classList.add("share-date");
    dateCreatedStat.innerHTML = msg("date-created", { date: dateCreatedText });
    dateStats.insertBefore(dateCreatedStat, end);

    let dateModifiedStat = document.createElement("span");
    dateModifiedStat.classList.add("share-date");
    dateModifiedStat.innerHTML = msg("date-modifed", { date: dateModifiedText });
    dateStats.insertBefore(dateModifiedStat, end);
  }
