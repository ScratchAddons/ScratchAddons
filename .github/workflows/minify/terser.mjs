import { minify as minifyJs } from "terser";
import { writeFile, readFile } from "fs/promises";
import { readFileSync } from "fs";
import { resolve } from "path";
import getInDir from "./getInDir.mjs";

/* Javascript */
const terserConfig = JSON.parse(readFileSync(resolve(process.cwd(), "./.terserrc")));

getInDir({path: "./", ext: ".js"}).forEach(async (filePath) => {
  console.log(`Minifying ${filePath}`);
  const source = await readFile(filePath, "utf8");
  const minfied = (await minifyJs(source, terserConfig)).code;
  writeFile(filePath, minfied);
});
