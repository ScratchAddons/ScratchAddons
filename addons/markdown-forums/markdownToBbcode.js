import { Marked } from "../../libraries/thirdparty/cs/marked.esm.js";

const marked = new Marked();

export const toBBCode = (markdown) => {
  try {
    return { success: true, bbcode: marked.parse(markdown) };
  } catch (e) {
    return { success: false, message: e.message.split("\n")[0], error: e };
  }
};

const options = {
  renderer: {
    code({ text, lang }) {
      return lang === "scratchblocks"
        ? `[scratchblocks]${text}[/scratchblocks]`
        : lang === "raw-bbcode"
          ? text
          : `[code${lang ? ` ${lang}` : ""}]${text}[/code]`;
    },
    blockquote({ tokens }) {
      const text = this.parser.parse(tokens);
      const author = text.match(/^(?:\[b\])?(.*?) wrote:(?:\[\/b\])?/);
      return author
        ? `[quote ${author[1]}]${text.split("\n").slice(1).join("\n")}[/quote]`
        : `[quote]${text}[/quote]\n`;
    },
    heading({ tokens, depth }) {
      const { open, close } = HEADING_LEVELS[depth];
      return `${open}${this.parser.parseInline(tokens)}${close}\n`;
    },
    hr() {
      return "---\n\n";
    },
    list({ ordered, start, items }) {
      return `[list${ordered ? ` ${start}` : ""}]${items
        .map((item) => options.renderer.listitem.call(this, item))
        .join("\n")}[/list]\n`;
    },
    listitem({ checked, tokens }) {
      return `[*]${checked === undefined ? "" : checked ? "☑ " : "☐ "}${this.parser.parseInline(tokens)}`;
    },
    paragraph({ tokens }) {
      return `${this.parser.parseInline(tokens)}\n`;
    },
    table({ header, rows }) {
      const allRows = [header, ...rows];
      const columnLengths = [];
      allRows.forEach((row) => {
        row.forEach(({ text }, i) => {
          if (text.length > (columnLengths[i] ?? 0)) {
            columnLengths[i] = text.length;
          }
        });
      });
      const borders =
        "=".repeat(
          columnLengths.reduce((a, b) => a + b, 0) +
            (columnLengths.length + 1) + // bars
            columnLengths.length * 2 // spaces
        ) + "\n";
      let out = "[code]\n" + borders;
      allRows.forEach((row) => {
        row.forEach(({ text, align }, i) => {
          const length = columnLengths[i] ?? 0;
          const finalText = (
            align === "right"
              ? text.padStart(length, " ")
              : align === "center"
                ? " ".repeat(Math.floor((length - text.length) / 2)) +
                  text +
                  " ".repeat(Math.ceil((length - text.length) / 2))
                : text.padEnd(length, " ")
          ).replace(/(?<=\[)\/?(?=code\])/g, (s) => s + "\u200d");
          out += `| ${finalText} `;
        });
        out += "|\n";
        if (row[0].header) {
          out += borders;
        }
      });
      out += borders;
      out += "[/code]";
      return out;
    },
    strong({ tokens }) {
      return `[b]${this.parser.parseInline(tokens)}[/b]`;
    },
    em({ tokens }) {
      return `[i]${this.parser.parseInline(tokens)}[/i]`;
    },
    codespan({ text }) {
      return options.renderer.text.call(this, { text });
    },
    br() {
      return "\n";
    },
    del({ tokens }) {
      return `[s]${this.parser.parseInline(tokens)}[/s]`;
    },
    link({ href, tokens }) {
      return `[url ${href}]${this.parser.parseInline(tokens)}[/url]`;
    },
    image({ href, text }) {
      return `[img ${href}]${text ? `\n[small][i]${text}[/i][/small]` : ""}`;
    },
    text({ tokens, text }) {
      return tokens ? this.parser.parseInline(tokens) : text.replace(/\[/g, "[[]");
    },
  },
  walkTokens(token) {
    if (token.type === "text" || token.type === "codespan") {
      token.text = token.raw;
    }
  },
  hooks: {
    postprocess(bbcode) {
      // removes any instances of paragraph ends right before closing tags, e.g.
      // [quote]Hello!
      //
      // [/quote]
      return bbcode.replace(/$\n^$\n(?=\[\/(?!code))/gm, "").trim();
    },
  },
};
marked.use(options);

const HEADING_LEVELS = {
  1: { open: "[big][b]", close: "[/b][/big]" },
  2: { open: "[big][u]", close: "[/u][/big]" },
  3: { open: "[big]", close: "[/big]" },
  4: { open: "[b][u]", close: "[/u][/b]" },
  5: { open: "[u]", close: "[/u]" },
  6: { open: "[b]", close: "[/b]" },
};
