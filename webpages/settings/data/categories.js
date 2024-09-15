import { getMessage } from "../../../libraries/common/settings-page-apis.js";

export default [
  {
    id: "all",
    icon: "list",
    name: getMessage("all"),
  },
  {
    id: "editor",
    icon: "puzzle",
    name: getMessage("editorFeatures"),
  },
  {
    id: "codeEditor",
    parent: "editor",
    icon: "code",
    name: getMessage("codeEditorFeatures"),
  },
  {
    id: "costumeEditor",
    parent: "editor",
    icon: "brush2",
    name: getMessage("costumeEditorFeatures"),
  },
  {
    id: "projectPlayer",
    parent: "editor",
    icon: "player",
    name: getMessage("projectPlayerFeatures"),
  },
  {
    id: "editorOthers",
    parent: "editor",
    icon: "dots",
    name: getMessage("others"),
  },
  {
    id: "community",
    icon: "web",
    name: getMessage("websiteFeatures"),
  },
  {
    id: "projectPage",
    parent: "community",
    icon: "projectpage",
    name: getMessage("projectPageFeatures"),
  },
  {
    id: "profiles",
    parent: "community",
    icon: "users",
    name: getMessage("profilesFeatures"),
  },
  {
    id: "forums",
    parent: "community",
    icon: "forum",
    name: getMessage("forums"),
  },
  {
    id: "communityOthers",
    parent: "community",
    icon: "dots",
    name: getMessage("others"),
  },
  {
    id: "theme",
    icon: "brush",
    name: getMessage("themes"),
  },
  {
    id: "themesForEditor",
    parent: "theme",
    icon: "puzzle",
    name: getMessage("editorThemes"),
  },
  {
    id: "themesForWebsite",
    parent: "theme",
    icon: "web",
    name: getMessage("websiteThemes"),
  },
  {
    id: "popup",
    icon: "popup",
    name: getMessage("popupFeatures"),
    marginBottom: true,
  },
];
