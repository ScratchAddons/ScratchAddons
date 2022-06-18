import { HTTPError } from "../../libraries/common/message-cache.js";

const SETTINGS_TO_STUDIO_ID = {
  griffpatch: 539952,
};

const studioStrategy = async (addon) => {
  let res;
  const studioId = SETTINGS_TO_STUDIO_ID[addon.settings.get("gameSource")];
  try {
    res = await fetch(`https://api.scratch.mit.edu/studios/${studioId}/projects/?limit=40`);
  } catch (e) {
    console.warn("Error when fetching studio: ", e);
    throw new HTTPError(`Error when fetching studio: ${e}`, 500);
  }
  if (res.status >= 400) {
    console.warn("Error when fetching studio: ", res.status);
    throw HTTPError.fromResponse("Error when fetching studio", res);
  }
  return res.json();
};

const deduplicate = (items) => {
  if (!items) return [];
  return Array.from(new Set(items));
};

const customStrategy = async (addon) =>
  Promise.all(
    deduplicate(addon.settings.get("customGames").map(({ url }) => url)).map(async (url) => {
      const projectId = url.match(/\d+/)?.[0];
      if (!projectId || isNaN(projectId)) return null;
      let res;
      try {
        res = await fetch(`https://api.scratch.mit.edu/projects/${projectId}`);
      } catch (e) {
        console.warn("Error when fetching project: ", e);
        return null;
      }
      if (res.status >= 400) {
        console.warn("Error when fetching project: ", res.status);
        return null;
      }
      return res.json();
    })
  ).then((projects) => projects.filter((project) => project));

export default async ({ addon, msg, safeMsg }) => {
  window.vue = new Vue({
    el: "body",
    data: {
      projects: [],
      projectsVisible: false,
      messages: {
        loadingMsg: msg("loading"),
        noUsersMsg: msg("no-users"),
      },
      projectsChecked: 0,
      error: null,
    },
    computed: {
      projectsSorted() {
        return this.projects.sort((b, a) => {
          if (a.amt !== b.amt) return a.amt - b.amt;
          return a.timestamp - b.timestamp;
        });
      },
      errorMessage() {
        return this.error && msg(this.error);
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
            projectObject.timestamp = json[0]?.timestamp || 0;
            projectObject.amt = usersSet.size;
            projectObject.users = Array.from(usersSet);
            this.projectsChecked++;
            if (this.projectsChecked / this.projects.length > 0.5) {
              // Show UI even tho it's not ready, if a majority of projects loaded
              this.projectsVisible = true;
            }
            resolve();
          }, i * 125);
        });
      },
      settingsHTML() {
        const link = document.createElement("a");
        link.target = "_blank";
        link.href = chrome.runtime.getURL("/webpages/settings/index.html#addon-cloud-games");
        link.textContent = msg("addon-settings");
        return safeMsg("change-studio", {
          settings: link.outerHTML,
        });
      },
    },
    async created() {
      document.title = msg("popup-title");
      let projects;
      try {
        if (addon.settings.get("gameSource") === "custom") {
          projects = await customStrategy(addon);
        } else {
          projects = await studioStrategy(addon);
        }
      } catch (e) {
        if (e instanceof HTTPError) {
          const code = e.code;
          if (code >= 500) this.error = "server-error";
          else if (code >= 400) this.error = "general-error";
          return;
        }
        throw e;
      }
      if (projects.length === 0) {
        this.error = "no-projects";
        return;
      }
      this.projects = projects
        .map((project) => ({ title: project.title, id: project.id, amt: 0, users: [], extended: true }))
        .reverse();
      await Promise.all(this.projects.map((project, i) => this.setCloudDataForProject(project, i)));
    },
  });
};
