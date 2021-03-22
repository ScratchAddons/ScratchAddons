import { message, danger } from "danger";
const modified = danger.git.modified_files;

const modifiedMD = danger.git.modified_files.join("- ");
message("Changed Files in this PR: \n - " + modifiedMD);
const modifiedLibFiles = modified
  .filter(p => includes(p, 'libraries/'))

if (modifiedLibFiles) {
  if (!modifiedLibFiles.includes("CREDITS.md") || !modifiedLibFiles.includes("license-info.json") {
        warn(
    "There are library changes, but you didn't change CREDITS.md or license-info.json. Do they need changing?",
      ); 
}
}
