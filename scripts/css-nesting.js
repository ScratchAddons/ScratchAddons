import postcss from "postcss";
import nesting from "postcss-nesting";
import prettier from "prettier";
import { globby } from "globby";
import fs from "fs/promises";

const prettierConfig = await prettier.resolveConfig("");

const cssFiles = await globby(["**.css"]);
console.log(`Checking ${cssFiles.length} css files.`);
for (const cssFile of cssFiles) {
  const contents = await fs.readFile(cssFile, "utf-8");
  const res = await nestCss(contents);
  if (res !== contents) {
    console.log(`Writing ${cssFile}.`);
    const pretty = await prettier.format(res, { parser: "css", ...prettierConfig });
    await fs.writeFile(cssFile, pretty);
  }
}
const htmlFiles = await globby(["**.html"]);
console.log(`Checking ${htmlFiles.length} html files.`);
for (const htmlFile of htmlFiles) {
  let htmlContents = await fs.readFile(htmlFile, "utf-8");
  const matches = htmlContents.matchAll(/<style>(.*)<\/style>/gs);
  let replaced = false;
  for (const [_, contents] of matches) {
    const res = await nestCss(contents);
    if (res != contents) {
      htmlContents = htmlContents.replace(contents, res);
      replaced = true;
    }
  }
  if (replaced) {
    console.log(`Writing ${htmlFile}.`);
    const pretty = await prettier.format(htmlContents, { parser: "html", ...prettierConfig });
    await fs.writeFile(htmlFile, pretty);
  }
}

async function nestCss(contents) {
  const res = await postcss([nesting()]).process(contents, { from: undefined });
  return res.css;
}
