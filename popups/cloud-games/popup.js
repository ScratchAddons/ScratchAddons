import { HTTPError } from "../../libraries/common/message-cache.js";

const studioStrategy = async (studioId) => {
  let res;
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
  return res.json().catch((exc) => {
    console.warn("Error when fetching studio JSON: ", exc);
    throw exc;
  });
};

const getRegex = () => /^(?:(?:https?:\/\/scratch\.mit\.edu\/)?(project|studio)s\/)?(\d+)/;

const extractUrl = (url) => {
  if (!url) return {};
  const match = url.match(getRegex());
  if (!match) return {};
  const type = match[1] || "project";
  const id = match[2];
  if (isNaN(id)) return {};
  return { id: +id, type };
};

const strategy = async (addon, displayedGames) =>
  Promise.all(
    displayedGames.map(async ({ id, type }) => {
      if (!id) return;
      if (type === "studio") return await studioStrategy(id);
      let res;
      try {
        res = await fetch(`https://api.scratch.mit.edu/projects/${id}`);
      } catch (e) {
        console.warn("Error when fetching project: ", e);
        return null;
      }
      if (res.status >= 400) {
        console.warn("Error when fetching project: ", res.status);
        return null;
      }
      return res.json().catch((exc) => {
        console.warn("Error when fetching project JSON: ", exc);
        return null;
      });
    }),
  ).then((projects) => {
    projects = projects.flat();
    const filtered = [];
    const knownIds = new Set();
    for (const project of projects) {
      if (!project || knownIds.has(project.id)) continue;
      knownIds.add(project.id);
      filtered.push(project);
    }
    return filtered;
  });

export default async ({ addon, msg, safeMsg }) => {
  const displayedGames = addon.settings
    .get("displayedGames")
    .map(({ url }) => url)
    .map(extractUrl);
  const gameSet = new Set(displayedGames.map(({ id, type }) => `${type}/${id}`));
  window.vue = new Vue({
    el: "body",
    data: {
      projects: [],
      projectsVisible: false,
      messages: {
        loadingMsg: msg("loading"),
        noUsersMsg: msg("no-users"),
        addProject: msg("add-project"),
        addProjectDescription: msg("add-project-desc"),
        addStudio: msg("add-studio"),
        addStudioDescription: msg("add-studio-desc"),
        added: msg("added"),
        changeDisplay2: msg("change-display-2"),
      },
      projectsChecked: 0,
      error: null,
      selectedTabUrl: null,
      addButtonUsed: false,
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
      addButtonType() {
        if (this.projects.length === 0 && this.error !== "no-projects") return null;
        if (this.projectsChecked !== this.projects.length) return null;
        const { id, type } = extractUrl(this.selectedTabUrl);
        if (!id || gameSet.has(`${type}/${id}`)) return null;
        return type;
      },
      clickButtonToAddDisplayMessage() {
        return msg("change-display-open", {
          buttonName: msg(`add-${this.addButtonType}`),
        });
      },
    },
    methods: {
      setCloudDataForProject(projectObject, i) {
        return new Promise((resolve) => {
          setTimeout(async () => {
            const handle = () => {
              this.projectsChecked++;
              if (this.projectsChecked / this.projects.length > 0.5) {
                // Show UI even tho it's not ready, if a majority of projects loaded
                this.projectsVisible = true;
              }
              resolve();
            };
            let json;
            try {
              const res = await fetch(
                `https://clouddata.scratch.mit.edu/logs?projectid=${projectObject.id}&limit=40&offset=0`,
              );
              if (res.status >= 400) {
                if (res.status >= 500) projectObject.errorMessage = msg("server-error");
                throw HTTPError.fromResponse(`Error when fetching cloud data for ${projectObject.id}`, res);
              }
              json = await res.json();
            } catch (exc) {
              console.warn("Error when fetching cloud data", exc);
              projectObject.error = msg("fetch-error");
              if (!projectObject.errorMessage) {
                projectObject.errorMessage = String(exc);
              }
              handle();
              return;
            }
            const dateNow = Date.now();
            const usersSet = new Set();
            for (const varChange of json) {
              if (dateNow - varChange.timestamp > 60000) break;
              usersSet.add(varChange.user);
            }
            projectObject.timestamp = json[0]?.timestamp || 0;
            projectObject.amt = usersSet.size;
            projectObject.users = Array.from(usersSet);
            handle();
          }, i * 125);
        });
      },
      settingsHTML() {
        const link = document.createElement("a");
        link.target = "_blank";
        link.href = chrome.runtime.getURL("/webpages/settings/index.html#addon-cloud-games");
        link.textContent = msg("addon-settings");
        return safeMsg("change-display", {
          settings: link.outerHTML,
        });
      },
      addFromSelectedTab() {
        this.addButtonUsed = true;
        const { id, type } = extractUrl(this.selectedTabUrl);
        const url = `https://scratch.mit.edu/${type}s/${id}`;
        addon.popup.changeSettings({
          displayedGames: [...addon.settings.get("displayedGames"), { url }],
        });
        setTimeout(() => location.reload(), 1500);
      },
    },
    async created() {
      document.title = msg("popup-title");
      addon.popup.getSelectedTabUrl().then((url) => {
        this.selectedTabUrl = url;
      });
      let projects;
      try {
        projects = await strategy(addon, displayedGames);
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
        .map((project) => ({
          title: project.title,
          id: project.id,
          amt: 0,
          users: [],
          extended: true,
          error: null,
          errorMessage: "",
        }))
        .reverse();
      await Promise.all(this.projects.map((project, i) => this.setCloudDataForProject(project, i)));
    },
  });
};
