import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "tmp", "test-results", "playwright-report", "scratch"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true }
      ]
    }
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.browser
      }
    }
  },
  {
    files: ["scripts/google-drive-apps-script.js"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ContentService: "readonly",
        DriveApp: "readonly",
        Utilities: "readonly"
      }
    },
    rules: {
      "no-control-regex": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  },
  {
    files: ["*.mjs", "*.cjs"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node
    }
  },
  {
    files: ["functions/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        fetch: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  {
    files: ["public/sw.js"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.serviceworker,
        URL: "readonly"
      }
    }
  }
);
