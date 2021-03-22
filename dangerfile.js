import { message, danger, warn } from "danger";
import prettier from "prettier";

const modified = danger.git.modified_files;
if (!danger.github.pr.title.includes("Translation update:")) {
  const modifiedMD = danger.git.modified_files.join("- ");
  message("Changed Files in this PR: \n - " + modifiedMD);
  const modifiedLibFiles = modified.filter((p) => p.includes("libraries/"));

  if (modifiedLibFiles.includes("libraries/")) {
    if (
      !modifiedLibFiles.includes("libraries/CREDITS.md") ||
      !modifiedLibFiles.includes("libraries/license-info.json")
    ) {
      warn("There are library changes, but you didn't change CREDITS.md or license-info.json. Do they need changing?");
    }
  }
}
prettier();
