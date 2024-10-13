import { textColor, multiply, alphaBlend, makeHsv } from "../../../../libraries/common/cs/text-color.esm.js";

export default async function ({ template }) {
  const EditorDarkModePreview = Vue.extend({
    props: ["options", "settings", "hoveredSettingId"],
    template,
    data() {
      return {
        tabs: [
          { id: "code", textLength: 4 },
          { id: "costumes", textLength: 8 },
          { id: "sounds", textLength: 6 },
        ],
        selectedTab: "code",
        fullScreenView: false,
        blockCategories: [
          { primary: "#4c97ff", tertiary: "#3373cc", textLength: [6] },
          { primary: "#9966ff", tertiary: "#774dcb", textLength: [5] },
          { primary: "#cf63cf", tertiary: "#bd42bd", textLength: [5] },
          { primary: "#ffd500", tertiary: "#cc9900", textLength: [6] },
          { primary: "#ffab19", tertiary: "#cf8b17", textLength: [7] },
          { primary: "#5cb1d6", tertiary: "#2e8eb8", textLength: [7] },
          { primary: "#59c059", tertiary: "#389438", textLength: [9] },
          { primary: "#ff8c1a", tertiary: "#db6e00", textLength: [9] },
          { primary: "#ff6680", tertiary: "#ff3355", textLength: [2, 6] },
        ],
        soundEffects: [
          { textLength: [6] },
          { textLength: [6] },
          { textLength: [6] },
          { textLength: [6] },
          { textLength: [4] },
          { textLength: [4, 2] },
          { textLength: [4, 3] },
          { textLength: [7] },
          { textLength: [7] },
        ],
      };
    },
    computed: {
      colors() {
        return {
          primaryText: textColor(this.settings.primary),
          menuBarText: textColor(this.settings.menuBar),
          accentText: textColor(this.settings.accent),
          inputText: textColor(this.settings.input),
          categoryMenuText: textColor(this.settings.categoryMenu),
          selectorText: textColor(this.settings.selector),
          selector2Text: textColor(this.settings.selector2),
          pageText: textColor(this.settings.page, "rgba(87, 94, 117, 0.75)", "rgba(255, 255, 255, 0.75)"),
          menuBarBorder: textColor(this.settings.menuBar, "rgba(0, 0, 0, 0.15)", "rgba(255, 255, 255, 0.15)", 60),
          accentTransparentText: textColor(this.settings.accent, "rgba(87, 94, 117, 0.5)", "rgba(255, 255, 255, 0.3)"),
          accentArtboard: this.settings.affectPaper ? this.settings.accent : "#ffffff",
          accentCheckerboard: this.settings.affectPaper
            ? multiply(
                textColor(
                  // see addons/editor-dark-mode/paper.js
                  this.settings.accent,
                  alphaBlend(this.settings.accent, multiply(makeHsv(this.settings.page, 1, 0.67), { a: 0.15 })),
                  alphaBlend(this.settings.accent, multiply(makeHsv(this.settings.page, 0.5, 1), { a: 0.15 })),
                  112 // threshold: #707070
                ),
                { a: 0.55 }
              )
            : "#d9e3f28c",
          tabText: textColor(this.settings.tab, "rgba(87, 94, 117, 0.75)", "rgba(255, 255, 255, 0.75)"),
          categoryMenuSelection: textColor(
            this.settings.categoryMenu,
            "rgba(87, 124, 155, 0.13)",
            "rgba(255, 255, 255, 0.05)"
          ),
          primaryTransparent15: multiply(this.settings.primary, { a: 0.15 }),
          primaryTransparent35: multiply(this.settings.primary, { a: 0.35 }),
          inputTransparent: multiply(this.settings.input, { a: 0.25 }),
        };
      },
    },
    methods: {
      selectTab(id) {
        this.selectedTab = id;
        this.$emit("areahover", "activeTab");
      },
      toggleFullScreenView() {
        this.fullScreenView = !this.fullScreenView;
      },
      cssVariables(obj) {
        return Object.entries(obj)
          .map(([name, value]) => `${name}: ${value};`)
          .join("\n");
      },
    },
  });
  Vue.component("preview-editor-dark-mode", EditorDarkModePreview);
}
