import { HTTPError } from "../../libraries/common/message-cache.js";

const fetchFaves = async (user) => {
  let res;
  try {
    res = await fetch(`https://api.scratch.mit.edu/users/${user}/favorites/?limit=40`);
  } catch (e) {
    console.warn("Error when fetching favorites: ", e);
    throw new HTTPError(`Error when fetching favorites: ${e}`, 500);
  }
  if (res.status >= 400) {
    throw HTTPError.fromResponse("Error when fetching favorites", res);
  }
  return res.json()
}

export default async ({ addon, msg, safeMsg }) => {
  window.vue = new Vue({
    el: "body",
    data: {
      projects: [],
      projectsVisable: false,
      error: null,
      messages: {
        loadingMsg: msg("loading"),
      },
    },
    async created() {
      if (!await addon.auth.fetchIsLoggedIn()) {
        this.error = msg("login");
        return
      }
      const username = await addon.auth.fetchUsername();
      let projects;
      try {
        projects = await fetchFaves(username);
      } catch (e) {
        if (e instanceof HTTPError) {
          this.error = msg((e.status >= 500) ? "server-error" : "general-error");
        }
      }
      this.projects = projects.map((project) => ({ title: project.title, id: project.id }));
      if (projects.length > 0) {
        this.projectsVisable = true;
      } else {
        this.error = msg("no-projects");
      }
    },
  });
};
