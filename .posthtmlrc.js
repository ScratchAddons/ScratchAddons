const postCssConfig = require("./postcss.config.js");

module.exports = {
  input: "**.html",
  skip: [],
  options: {
    sync: false,
    directives: [
      {
        name: "",
        start: "{{",
        end: "}}",
      },
    ],
    quoteAllAttributes: false,
    replaceQuote: false,
    quoteStyle: 0,
    lowerCaseTags: true,
    lowerCaseAttributeNames: true,
    recognizeCDATA: true,
    recognizeSelfClosing: true,
    sourceLocations: true,
  },
  plugins: [
    require("posthtml-postcss")(postCssConfig.plugins, { map: false, from: undefined }),
    require("htmlnano")({
      collapseAttributeWhitespace: true,
      collapseWhitespace: "aggressive",
      deduplicateAttributeValues: true,
      removeAttributeQuotes: true,
      removeEmptyAttributes: false,
      minifyCss: false,
      minifyConditionalComments: true,
      removeRedundantAttributes: true,
      mergeStyles: true,
      sortAttributesWithLists: true,
      sortAttributes: "frequency",
      removeOptionalTags: true,
      normalizeAttributeValues: true,
    }),
  ],
};
