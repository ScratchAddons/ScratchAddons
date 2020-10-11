var vue = new Vue({
  el: "body",
  data: {
    loaded: false,
    users: [],
  },
  computed: {
    usersPfp: function () {
      var list;
      this.users.forEach(user => {
        fetch("https://api.scratch.mit.edu/users/" + user)
        .then(res => res.json())
        .then(json => list.push(json.profile.images["32x32"]));
      });
      return list;
    },
    usersUrl: function () {
      var list;
      this.users.forEach(user => {
        list.push("https://scratch.mit.edu/users/" + user);
      });
      return list;
    },
  },
});

fetchUsers();
vue.loaded = true;

function fetchUsers () {

}
