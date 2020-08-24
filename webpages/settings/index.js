const vue = new Vue({
  el: ".main",
  data: {
    addons: [],
  },
});

chrome.runtime.sendMessage("getSettingsInfo", ({ manifests }) => {
  vue.addons = manifests;
  console.log(manifests);
});
