var vue = new Vue({
  el: "body",
  data: {
    loaded: false,
    users: [],
  },
  computed: {
    usersPfp: function () {
      var list;
      this.users.forEach(async function (user) {
        const response = await fetch("https://api.scratch.mit.edu/users/" + user);
        const json = await response.json();
        list.push(json.profile.images["32x32"]);
      });
      return list;
    },
    usersUrl: function () {
      var list;
      this.users.forEach((user) => {
        list.push("https://scratch.mit.edu/users/" + user);
      });
      return list;
    },
  },
});

fetchUsers();
vue.loaded = true;

async function fetchUsers() {}
