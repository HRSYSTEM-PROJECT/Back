// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
 {
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',

    // 🔹 Desactiva reglas que entran en conflicto
    'no-trailing-spaces': 'off',
    'eol-last': 'off',

    // 🔹 Prettier solo debe aplicar lo que tú configuraste
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
        trailingComma: 'none',
        semi: true,
        singleQuote: true
      }
    ]
  }
 })
