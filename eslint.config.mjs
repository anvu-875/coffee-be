import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  globalIgnores([
    'dist',
    'node_modules',
    'public',
    'deploy',
    'eslint.config.mjs',
    'swagger-docs.json',
    'nodemon.json',
    'package.json',
    'package-lock.json',
    'README.md',
    'tsconfig.json',
    '.prettierignore',
    '.prettierrc'
  ]),
  {
    files: ['src/**/*.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strict,
      tseslint.configs.stylistic
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      'prefer-const': 'off',
      'prefer-template': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn'
    }
  },
  {
    extends: [eslintPluginPrettier],
    rules: {
      'prettier/prettier': [
        'warn',
        {
          arrowParens: 'always',
          semi: true,
          trailingComma: 'none',
          tabWidth: 2,
          endOfLine: 'auto',
          useTabs: false,
          singleQuote: true,
          printWidth: 80
        }
      ]
    }
  }
);
