import { message, danger, warn, markdown } from "danger";
const prettier = require("prettier");
const fs = require("fs");
let pr = danger.github.pr;
if (!pr.title.includes("Translation update:")) {

markdown("#### Danger PR Checks");
// PRs should have at least a sentance of description
if (pr.body.length === 0) {
  fail("Please add a description to your PR.");
}

var path = require("path");
if (pr.author_association == "FIRST_TIME_CONTRIBUTOR") {
  message(
    "Hello, this is your first contribution. If you want, you can check out other issues and PRs to get up to date on our standards."
  );
}
const modified = danger.git.modified_files;
// Check all files for Prettier
let badFiles = [];
for (var file of modified) {
  resolved = path.resolve(file);
  let readFile = fs.readFileSync(resolved, { encoding: "utf8", flag: "r" });
  let info = prettier.getFileInfo.sync(resolved);
  if (info.ignored) return;
  const extname = path.extname(file);
  const filePath = path.basename(file, extname);
  if (extname == ".svg") return;
  let check = prettier.check(readFile, { filepath: filePath + extname });
  if (!check) badFiles.push(file);
}
if (badFiles.length > 0) {
  warn(
    `${badFiles.length} need to be formatted with Prettier. Please format your code using Prettier, or go [here](https://github.com/${pr.user}/ScratchAddons/actions) to enable formatting automation.`
  );
  markdown(`
### Files that need to be prettified
  - ${badFiles.join("\n- ")}
`);
}
  const modifiedLibFiles = modified.filter((p) => p.includes("libraries/"));

  if (modifiedLibFiles.includes("libraries/")) {
    if (
      !modifiedLibFiles.includes("libraries/CREDITS.md") ||
      !modifiedLibFiles.includes("libraries/license-info.json")
    ) {
      warn("There are library changes, but you didn't change CREDITS.md or license-info.json. Do they need changing?");
    }
  }
  markdown(`If something looks wrong, please ping one of our members to check.`);
}
