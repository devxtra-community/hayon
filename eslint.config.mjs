import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import next from "@next/eslint-plugin-next";
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
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

  {
    files: ["frontend/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": next,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": ["error", "frontend/src/app"],
       "@typescript-eslint/no-explicit-any": "warn",
    },
    languageOptions: {
      parserOptions: {
        project: "./frontend/tsconfig.json",
      },
    },
  },

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
