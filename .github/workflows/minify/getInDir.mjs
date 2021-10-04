import { readdirSync, statSync } from "fs";
import { join, resolve } from "path";

export default function getAllFiles({ path = "./", arrayOfFiles = [], ext = "" } = {}) {
  let files = readdirSync(path);
  files.forEach((file) => {
    if (statSync(`${path}/${file}`).isDirectory() && ![".git", "node_modules"].includes(file)) {
      arrayOfFiles = getAllFiles({ path: `${path}/${file}`, arrayOfFiles, ext });
    } else if (file.endsWith(ext) && file !== ".eslintrc.json") {
      arrayOfFiles.push(join(resolve(), `${path}/${file}`));
    }
  });

  return arrayOfFiles;
}
