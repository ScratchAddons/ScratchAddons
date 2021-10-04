import { writeFile, readFile } from "fs/promises";
import getInDir from "./getInDir.mjs";

getInDir({}).forEach(async (filePath) => {
  console.log(`Updating URLs in ${filePath}`);
  const source = await readFile(filePath, "utf8").catch(console.error);

  const replaced = source.replace(/userscript\.scratchaddons\.cf/g, "sa-userscript.github.io/ScratchAddons");

  writeFile(filePath, replaced);
});
