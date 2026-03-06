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
    id: "editorOthers",
    parent: "editor",
    icon: "dots",
    name: getMessage("others"),
  },
  {
    id: "player",
    icon: "player",
    name: getMessage("playerFeatures"),
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
    id: "themesForPlayer",
    parent: "theme",
    icon: "player",
    name: getMessage("playerThemes"),
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
  {
    id: "easterEgg",
    name: getMessage("easterEggs"),
    hidden: true,
  },
];
