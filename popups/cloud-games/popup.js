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

const vue = new Vue({
  el: "body",
  data: {
    projects: [],
    loaded: false,
  },
  computed: {
    projectsSorted() {
      return this.projects.sort((b, a) => a.amt - b.amt);
    },
  },
  methods: {
    async setCloudDataForProject(projectObject) {
      const res = await fetch(`https://clouddata.scratch.mit.edu/logs?projectid=${projectObject.id}&limit=40&offset=0`);
      const json = await res.json();
      const dateNow = Date.now();
      const usersSet = new Set();
      for (const varChange of json) {
        if (dateNow - varChange.timestamp > 60000) break;
        usersSet.add(varChange.user);
      }
      projectObject.amt = usersSet.size;
      projectObject.users = Array.from(usersSet);
    },
  },
  async created() {
    const res = await fetch("https://api.scratch.mit.edu/studios/539952/projects/?limit=40");
    const projects = await res.json();
    this.projects = projects
      .map((project) => ({ title: project.title, id: project.id, amt: 0, users: [], extended: true }))
      .reverse();

    await Promise.all(this.projects.map((project) => this.setCloudDataForProject(project)));
    this.loaded = true;
  },
});
