export default async ({ addon, msg, safeMsg }) => {
  window.vue = new Vue({
    el: "body",
    data: {
      projects: [],
      projectsVisable: false,
    },
    async created() {
      const username = await addon.auth.fetchUsername();
      const res = await fetch(`https://api.scratch.mit.edu/users/${username}/favorites/?limit=40`);
      let projects = await res.json();
      this.projects = projects.map((project) => ({ title: project.title, id: project.id }));
      this.projectsVisable = true;
    },
  });
};
