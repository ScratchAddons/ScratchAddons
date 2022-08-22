export default [
  {
    id: "all",
    icon: "list",
    name: chrome.i18n.getMessage("all"),
  },
  {
    id: "editor",
    icon: "puzzle",
    name: chrome.i18n.getMessage("editorFeatures"),
  },
  {
    id: "codeEditor",
    parent: "editor",
    icon: "code",
    name: chrome.i18n.getMessage("codeEditorFeatures"),
  },
  {
    id: "costumeEditor",
    parent: "editor",
    icon: "brush2",
    name: chrome.i18n.getMessage("costumeEditorFeatures"),
  },
  {
    id: "projectPlayer",
    parent: "editor",
    icon: "tv",
    name: chrome.i18n.getMessage("projectPlayerFeatures"),
  },
  {
    id: "editorOthers",
    parent: "editor",
    icon: "more",
    name: chrome.i18n.getMessage("others"),
  },
  {
    id: "community",
    icon: "web",
    name: chrome.i18n.getMessage("websiteFeatures"),
  },
  {
    id: "projectPage",
    parent: "community",
    icon: "projectPage",
    name: chrome.i18n.getMessage("projectPageFeatures"),
  },
  {
    id: "profiles",
    parent: "community",
    icon: "people",
    name: chrome.i18n.getMessage("profilesFeatures"),
  },
  {
    id: "forums",
    parent: "community",
    icon: "forum",
    name: chrome.i18n.getMessage("forums"),
  },
  {
    id: "communityOthers",
    parent: "community",
    icon: "more",
    name: chrome.i18n.getMessage("others"),
  },
  {
    id: "theme",
    icon: "brush",
    name: chrome.i18n.getMessage("themes"),
  },
  {
    id: "themesForEditor",
    parent: "theme",
    icon: "puzzle",
    name: chrome.i18n.getMessage("editorThemes"),
  },
  {
    id: "themesForWebsite",
    parent: "theme",
    icon: "web",
    name: chrome.i18n.getMessage("websiteThemes"),
  },
  {
    id: "popup",
    icon: "popup",
    name: chrome.i18n.getMessage("popupFeatures"),
    marginBottom: true,
  },
];
