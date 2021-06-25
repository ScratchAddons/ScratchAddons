import WebsiteLocalizationProvider from "../../libraries/common/website-l10n.js";

(async () => {
  const l10n = new WebsiteLocalizationProvider();

  //theme
  const lightThemeLink = document.createElement("link");
  lightThemeLink.setAttribute("rel", "stylesheet");
  lightThemeLink.setAttribute("href", "light.css");

  chrome.storage.sync.get(["globalTheme"], function ({ globalTheme }) {
    /** True = light, false = dark. */
    if (globalTheme) {
      document.head.appendChild(lightThemeLink);
    }
  });

  await l10n.loadByAddonId("cloud-games");

  /**
   * @typedef {data &
   *   methods & {
   *     projectsSorted: { title: string; id: number; amt: number; users: string[]; extended: boolean }[];
   *     loadingMsg: string;
   *   }} thisVal
   */

  const data = {
    /** @type {{ title: string; id: number; amt: number; users: string[]; extended: boolean }[]} */
    projects: [],
    loaded: false,
    messages: { noUsersMsg: l10n.get("cloud-games/no-users") },
    projectsChecked: 0,
  };
  const methods = {
    /**
     * @param {{
     *   title: string;
     *   id: number;
     *   amt: number;
     *   users: string[];
     *   extended: boolean;
     * }} projectObject
     * @param {number} i
     *
     * @returns {Promise<void>}
     * @this {thisVal}
     */
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
  };

  window.vue = new Vue({
    el: "body",
    data,
    computed: {
      /** @this {data} */
      projectsSorted() {
        return this.projects.sort((b, a) => a.amt - b.amt);
      },
      /** @this {thisVal} */
      loadingMsg() {
        return l10n.get("cloud-games/loading", {
          done: `${this.projectsChecked}`,
          amount: `${this.projects.length}` || "?",
        });
      },
    },
    methods,
    /** @this {thisVal} */
    async created() {
      document.title = l10n.get("cloud-games/popup-title");
      const res = await fetch("https://api.scratch.mit.edu/studios/539952/projects/?limit=40");
      /**
       * @type {{
       *   id: number;
       *   title: string;
       *   image: string;
       *   creator_id: number;
       *   username: string;
       *   avatar: { "90x90": string; "60x60": string; "55x55": string; "50x50": string; "32x32": string };
       *   actor_id: number;
       * }[]}
       */
      const projects = await res.json();
      // TODO: add currently opened game to projects array. Sort function should put it on top
      this.projects = projects
        .map((project) => ({ title: project.title, id: project.id, amt: 0, users: [], extended: true }))
        .reverse();
      await Promise.all(this.projects.map(this.setCloudDataForProject));
    },
  });
})();
