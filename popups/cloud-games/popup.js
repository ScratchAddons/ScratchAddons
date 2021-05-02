import WebsiteLocalizationProvider from "../../libraries/website-l10n.js";

(async () => {
  const l10n = new WebsiteLocalizationProvider();

  //theme
  const lightThemeLink = document.createElement("link");
  lightThemeLink.setAttribute("rel", "stylesheet");
  lightThemeLink.setAttribute("href", "light.css");

  chrome.storage.sync.get(["globalTheme"], function (r) {
    let rr = false; //true = light, false = dark
    if (r.globalTheme) rr = r.globalTheme;
    if (rr) {
      document.head.appendChild(lightThemeLink);
    }
  });

  await l10n.loadByAddonId("cloud-games");

  window.vue = new Vue({
    el: "body",
    data: {
      projects: [],
      loaded: false,
      messages: { noUsersMsg: l10n.get("cloud-games/no-users") },
      projectsChecked: 0,
    },
    computed: {
      projectsSorted() {
        return this.projects.sort((b, a) => a.amt - b.amt);
      },
      loadingMsg() {
        return l10n.get("cloud-games/loading", { done: this.projectsChecked, amount: this.projects.length || "?" });
      },
    },
    methods: {
      setCloudDataForProject(projectObject, i) {
        return new Promise((resolve) => {
          setTimeout(async () => {
            const res = await fetch(
              `https://clouddata.scratch.mit.edu/logs?projectid=${projectObject.id}&limit=40&offset=0`
            );
            const json = await res.json();
            const dateNow = Date.now();
            const usersSet = new Set();
            for (const varChange of json) {
              if (dateNow - varChange.timestamp > 60000) break;
              usersSet.add(varChange.user);
            }
            projectObject.amt = usersSet.size;
            projectObject.users = Array.from(usersSet);
            this.projectsChecked++;
            if (this.projectsChecked / this.projects.length > 0.5) {
              // Show UI even tho it's not ready, if a majority of projects loaded
              this.loaded = true;
            }
            resolve();
          }, i * 125);
        });
      },
    },
    async created() {
      document.title = l10n.get("cloud-games/popup-title");
      const res = await fetch("https://api.scratch.mit.edu/studios/539952/projects/?limit=40");
      const projects = await res.json();
      // TODO: add currently opened game to projects array. Sort function should put it on top
      this.projects = projects
        .map((project) => ({ title: project.title, id: project.id, amt: 0, users: [], extended: true }))
        .reverse();
      await Promise.all(this.projects.map((project, i) => this.setCloudDataForProject(project, i)));
    },
  });
})();
