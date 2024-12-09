import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ["node_modules/*", "_locales/*", ".github/workflows/*", "addons-l10n/*", "libraries/thirdparty/*"],
  },
  ...compat.extends("eslint:recommended"),
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        scratchAddons: "writable",
        __scratchAddonsTraps: "writable",
        __scratchAddonsRedux: "writable",
        _realConsole: "writable",
        __scratchAddonsTextColor: "writable",
        Vue: "readonly",
        SparkMD5: "readonly",
        scratchblocks: "readonly",
        tinycolor: "readonly",
        Chart: "readonly",
        Comlink: "readonly",
        idb: "readonly",
        Scratch: "readonly",
        Blockly: "readonly",
        Clipboard: "readonly",
        ClipboardItem: "readonly",
      },

      ecmaVersion: 2022,
      sourceType: "module",
    },

    rules: {
      "no-prototype-builtins": 1,
      "no-template-curly-in-string": 2,
      "array-callback-return": 2,
      "default-case-last": 2,
      eqeqeq: 2,
      "guard-for-in": 2,

      "no-empty": [
        2,
        {
          allowEmptyCatch: true,
        },
      ],

      "no-caller": 2,
      "no-implied-eval": 2,
      "no-new-wrappers": 2,
      "no-proto": 2,
      "no-loss-of-precision": 2,
      "no-nonoctal-decimal-escape": 2,
      "no-unsafe-optional-chaining": 2,
      "no-useless-backreference": 2,
      "no-unused-vars": 0,
      "no-useless-escape": 0,
      "no-inner-declarations": 0,

      "no-constant-condition": [
        2,
        {
          checkLoops: false,
        },
      ],

      "no-restricted-syntax": [
        2,
        {
          selector:
            "MemberExpression[property.type=Identifier][property.name=path]:matches([object.name=e],[object.name=ev],[object.name=event])",
          message: "Event.path is incompatible with Firefox, use Event.composedPath()",
        },
      ],

      "no-constant-binary-expression": 2,
    },
  },
  {
    files: [
      "addon-api/background/*.js",
      "addon-api/popup/*.js",
      "addons/*/background.js",
      "background/**/*.js",
      "content-scripts/*.js",
      "libraries/common/*.js",
      "libraries/thirdparty/*.js",
      "popups/**/*.js",
      "webpages/**/*.js",
    ],

    languageOptions: {
      globals: {
        ...globals.webextensions,
      },
    },

    rules: {
      "no-eval": 2,
    },
  },
  {
    files: ["content-scripts/*.js"],

    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportExpression",
          message: "import() in content script is unsupported in Firefox, declare directly in manifest.json",
        },
        {
          selector:
            "MemberExpression[property.type=Identifier][property.name=path]:matches([object.name=e],[object.name=ev],[object.name=event])",
          message: "Event.path does not exist in Firefox, use Event.composedPath()",
        },
      ],
    },
    languageOptions: {
      globals: {
        immediatelyRunFunctionInMainWorld: "readonly",
      },
    },
  },
];
