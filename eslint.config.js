import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
    },
  },
];
