import { message, danger, warn, markdown } from "danger";
const prettier = require("prettier");
const fs = require("fs");
var path = require("path");
if (danger.github.pr.author_association == "FIRST_TIME_CONTRIBUTOR") {
  message(
    "Since this is your first contribution, here are some links while you wait for a review.\n[Our contributing guidelines](https://github.com/ScratchAddons/ScratchAddons/blob/master/CONTRIBUTING.md)"
  );
}
const modified = danger.git.modified_files;
let badFiles = [];
for (var file of modified) {
  resolved = path.resolve(file);
  let readFile = fs.readFileSync(resolved, { encoding: "utf8", flag: "r" });
  let info = prettier.getFileInfo.sync(resolved);
  console.log(resolved);
  if (info.ignored) return;
  const extname = path.extname(file);
  const filePath = path.basename(file, extname);
  if (extname == ".svg") return;
  let check = prettier.check(readFile, { filepath: filePath + extname });
  if (!check) badFiles.push(file);
}
if (badFiles.length > 0) {
  warn(
    `${danger.github.utils.fileLinks(
      badfiles
    )} need to be formatted with Prettier. To enable it, go to https://github.com/<yourusername>/ScratchAddons/actions and enable it.`
  );
}
if (!danger.github.pr.title.includes("Translation update:")) {
  const modifiedMD = danger.git.modified_files.join("- ");
  message(`This PR has ${danger.github.pr.additions} additions and ${danger.github.pr.deletions} deletions.`);
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
