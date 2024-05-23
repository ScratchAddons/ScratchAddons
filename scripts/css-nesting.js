import postcss from "postcss";
import nesting from "postcss-nesting";
import prettier from "prettier";
import { globby } from "globby";
import fs from "fs/promises";
import { parse } from "node-html-parser";

const cssFiles = await globby(["**.css"]);
console.log(`Checking ${cssFiles.length} css files.`);
for (const cssFile of cssFiles) {
  const contents = await fs.readFile(cssFile, "utf-8");
  const res = await checkReplaceCssFile(contents);
  if (res !== contents) {
    console.log(`Writing ${cssFile}.`);
    await fs.writeFile(cssFile, res);
  }
}
const htmlFiles = await globby(["**.html"]);
console.log(`Checking ${htmlFiles.length} html files.`);
for (const htmlFile of htmlFiles) {
  const contents = await fs.readFile(htmlFile, "utf-8");
  const root = parse(contents);
  const styleElements = root.getElementsByTagName("style");
  for (const styleElement of styleElements) {
    const res = await checkReplaceCssFile(styleElement.textContent);
    if (res !== styleElement.textContent) {
      console.log(`Writing ${htmlFile}.`);
      styleElement.textContent = "\n" + res;
      await fs.writeFile(htmlFile, root.toString());
    }
  }
}

async function checkReplaceCssFile(contents) {
  const res = await postcss([nesting()]).process(contents, { from: undefined });
  if (contents !== res.css) {
    const isPretty = await prettier.check(res.css, { parser: "css" });
    if (!isPretty) {
      res.css = await prettier.format(res.css, { parser: "css" });
    }
  }
  return res.css;
}
