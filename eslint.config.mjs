// eslint.config.mjs

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import next from "@next/eslint-plugin-next";

/**
 * ESLint v9 Flat Config
 * - NO legacy configs
 * - NO FlatCompat
 * - NO eslint-config-next
 * - This is the ONLY stable setup right now
 */

export default [
  /* -------------------------------------------------- */
  /* Base JS / TS                                       */
  /* -------------------------------------------------- */
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  /* -------------------------------------------------- */
  /* Backend (Node)                                     */
  /* -------------------------------------------------- */
  {
    files: ["backend/src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./backend/tsconfig.json",
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

  /* -------------------------------------------------- */
  /* Frontend (Next.js — FLAT NATIVE)                    */
  /* -------------------------------------------------- */
  {
    files: ["frontend/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": next,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": ["error", "frontend/src/app"],
    },
    languageOptions: {
      parserOptions: {
        project: "./frontend/tsconfig.json",
      },
    },
  },

  /* -------------------------------------------------- */
  /* Global ignores                                     */
  /* -------------------------------------------------- */
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
