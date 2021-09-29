const cssNanoConfig = {
  preset: [
    "default",
    {
      mergeIdents: true,
      svgo: false,
    },
  ],
};

module.exports = {
  cssNanoConfig,
  map: false,
  plugins: [
    require("postcss-import"),
    require("postcss-sort-media-queries"),
    require("cssnano")(cssNanoConfig),
    require("autoprefixer")({
      grid: "autoplace",
    }),
  ],
};
