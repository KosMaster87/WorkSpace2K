// @ts-check
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

const sharedRules = {
  ...tseslint.configs.recommended.rules,
  '@typescript-eslint/no-unused-vars': 'error',
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/explicit-function-return-type': 'warn',
};

module.exports = [
  // ── Source-Dateien (kein Test) → tsconfig.json ─────────────────────────────
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.test.ts', 'src/__tests__/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: sharedRules,
  },

  // ── Test-Dateien → tsconfig.test.json (enthält @types/jest) ────────────────
  {
    files: ['src/**/*.test.ts', 'src/__tests__/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.test.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: sharedRules,
  },

  // ── Global Ignores ──────────────────────────────────────────────────────────
  {
    ignores: ['dist/', 'node_modules/'],
  },
];
