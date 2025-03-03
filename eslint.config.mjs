import parser from "vue-eslint-parser";
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
    ignores: [
      "**/docs",
      "**/*.min.js",
      "**/*.min.css",
      "**/*.json",
      "**/src-tauri",
    ],
  },
  ...compat.extends(
    "plugin:vue/vue3-recommended",
    "plugin:vue-pug/vue3-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:tailwindcss/recommended",
    "prettier",
  ),
  {
    languageOptions: {
      parser: parser,
      ecmaVersion: 5,
      sourceType: "script",

      parserOptions: {
        parser: "@typescript-eslint/parser",

        templateTokenizer: {
          pug: "vue-eslint-parser-template-tokenizer-pug",
        },
      },
    },

    rules: {
      "vue/multi-word-component-names": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.vue", "**/*.ts"],
  },
  {
    ignores: [
      "node_modules",
      "dist",
      "docs",
      ".gitignore",
      ".output",
      ".nuxt",
      "utils/legacy",
    ],
  },
];
