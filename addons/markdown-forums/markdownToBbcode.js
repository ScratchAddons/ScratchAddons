import { marked } from "../../libraries/thirdparty/cs/marked.esm.js";

export const toBBCode = (markdown) => {
  try {
    return { success: true, bbcode: marked.parse(markdown, options) };
  } catch (e) {
    return { success: false, message: e.message.split("\n")[0] };
  }
};

const options = {
  renderer: {
    code(code, infostring) {
      return infostring === "scratchblocks"
        ? `[scratchblocks]${code}[/scratchblocks]`
        : infostring === "raw-bbcode"
        ? code
        : `[code${infostring === "" ? "" : ` ${infostring}`}]${code}[/code]`;
    },
    blockquote(quote) {
      const author = quote.match(/^(?:\[b\])?(.*?) wrote:(?:\[\/b\])?/);
      return author
        ? `[quote ${author[1]}]${quote.split("\n").slice(1).join("\n")}[/quote]`
        : `[quote]${quote}[/quote]\n`;
    },
    heading(text, level) {
      const { open, close } = HEADING_LEVELS[level];
      return `${open}${text}${close}\n`;
    },
    hr() {
      return "---\n\n";
    },
    list(body, ordered, start) {
      return `[list${ordered ? ` ${start}` : ""}]${body}[/list]\n`;
    },
    listitem(text) {
      return `[*]${text}\n`;
    },
    checkbox(checked) {
      return checked ? "☑" : "☐";
    },
    paragraph(text) {
      return `${text}\n\n`;
    },
    table() {
      throw new Error("no-tables");
    },
    tablerow() {
      throw new Error("no-tables");
    },
    tablecell() {
      throw new Error("no-tables");
    },
    strong(text) {
      return `[b]${text}[/b]`;
    },
    em(text) {
      return `[i]${text}[/i]`;
    },
    codespan(text) {
      return options.renderer.text(text);
    },
    br() {
      return "\n";
    },
    del(text) {
      return `[s]${text}[/s]`;
    },
    link(href, title, text) {
      return `[url ${href}]${text}[/url]`;
    },
    image(href, title, text) {
      return `[img ${href}]${text ? `\n[small][i]${text}[/i][/small]` : ""}`;
    },
    text(text) {
      return text.replace(/\[/g, "[[]");
    },
  },
  walkTokens(token) {
    if (token.type === "text" || token.type === "codespan") {
      token.text = token.raw;
    }
  },
  hooks: {
    preprocess(markdown) {
      return markdown;
    },
    postprocess(bbcode) {
      // removes any instances of paragraph ends right before closing tags, e.g.
      // [quote]Hello!
      //
      // [/quote]
      return bbcode.replace(/$\n^$\n(?=\[\/(?!code))/gm, "").trim();
    },
  },
};

const HEADING_LEVELS = {
  1: { open: "[big][b][u]", close: "[/u][/b][/big]" },
  2: { open: "[big][b]", close: "[/b][/big]" },
  3: { open: "[big]", close: "[/big]" },
  4: { open: "[b][u]", close: "[/u][/b]" },
  5: { open: "[b]", close: "[/b]" },
  6: { open: "", close: "" },
};
