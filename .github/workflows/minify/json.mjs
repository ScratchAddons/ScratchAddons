import { writeFile, readFile } from "fs/promises";
import getInDir from "./getInDir.mjs";

/* JSON */
getInDir({ path: "./", ext: ".json" }).forEach(async (filePath) => {
  const source = await readFile(filePath, "utf8");
  let parsed = JSON.parse(source, terserConfig);

  // Strip translator helps
  if (filePath.includes("_locales")) {
    for (const key in parsed) {
      if (!Object.hasOwnProperty.call(parsed, key)) continue;
      parsed[key] = { message: parsed[key].message };
    }
  }

  // Strip comments from `addons.json`
  if (filePath.endsWith("addons.json")) {
    parsed = [...new Set(parsed)].filter((folderName) => {
      return !folderName.startsWith("//");
    });
  }

  const minfied = JSON.stringify(parsed);
  writeFile(filePath, minfied);
});

getInDir({ path: "./", ext: ".map" }).forEach(async (filePath) => {
  const source = await readFile(filePath, "utf8");
  const parsed = JSON.parse(source, terserConfig);
  const minfied = JSON.stringify(parsed);
  writeFile(filePath, minfied);
});
