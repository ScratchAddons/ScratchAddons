export default async ({ addon, msg, safeMsg }) => {
  window.vue = new Vue({
    el: "body",
    data: {
      projects: [],
      loaded: false
    },
    async created() {
      const username = await addon.auth.fetchUsername();
      const res = await fetch(`https://api.scratch.mit.edu/users/${username}/favorites/`);
      let projects = await res.json();
      this.projects = projects.map((project) => ({ title: project.title, id: project.id }));
      this.loaded = true;
    }
  });
}
