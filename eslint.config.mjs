// eslint.config.mjs (ROOT)

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";

/**
 * ONE ESLint config
 * Plugins defined ONCE
 * Rules scoped by files
 */

export default [
  /* ------------------------------------------------------------------ */
  /* Base JS rules                                                       */
  /* ------------------------------------------------------------------ */
  js.configs.recommended,

  /* ------------------------------------------------------------------ */
  /* Base TypeScript rules (NON type-aware, safe defaults)               */
  /* ------------------------------------------------------------------ */
  ...tseslint.configs.recommended,

  /* ------------------------------------------------------------------ */
  /* Disable formatting rules (Prettier owns formatting)                 */
  /* ------------------------------------------------------------------ */
  prettier,

  /* ------------------------------------------------------------------ */
  /* -------------------------- BACKEND -------------------------------- */
  /* ------------------------------------------------------------------ */
  {
    files: ["backend/src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./backend/tsconfig.json",
        sourceType: "module",
      },
    },
    rules: {
      "no-console": "off",
      "consistent-return": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],

      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  /* ------------------------------------------------------------------ */
  /* -------------------------- FRONTEND ------------------------------- */
  /* ------------------------------------------------------------------ */
  {
    files: ["frontend/**/*.{ts,tsx,js,jsx}"],
    extends: [...nextVitals],
    languageOptions: {
      parserOptions: {
        project: "./frontend/tsconfig.json",
      },
    },
  },

  /* ------------------------------------------------------------------ */
  /* -------------------------- GLOBAL IGNORES ------------------------- */
  /* ------------------------------------------------------------------ */
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/next-env.d.ts",
    ],
  },
];
