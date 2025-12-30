import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  // Base JS rules
  js.configs.recommended,

  // TypeScript rules (NON type-aware, safe defaults)
  ...tseslint.configs.recommended,

  // Disable formatting rules (Prettier owns formatting)
  prettier,

  // Type-aware rules ONLY for source files
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    rules: {
      'no-console': 'off',
      'consistent-return': 'error',

      // TS-specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],

      // We will soften this (see below)
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];