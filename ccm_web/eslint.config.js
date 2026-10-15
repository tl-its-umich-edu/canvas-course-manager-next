/*
References:
- https://eslint.org/docs/latest/use/configure/configuration-files
- https://github.com/mightyiam/eslint-config-love (successor of eslint-config-standard-with-typescript)
*/

import { defineConfig } from 'eslint/config'
import love from 'eslint-config-love'
import react from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'

export default defineConfig(
  { ignores: ['bundles/', 'dist/', 'node_modules/'] },
  {
    files: ['client/src/**/*.{ts,tsx}', 'webpack/**/*.ts'],
    extends: [
      react.configs.flat.recommended,
      // tsconfig uses "jsx": "react-jsx", so React doesn't need to be imported for JSX
      react.configs.flat['jsx-runtime'],
      tseslint.configs.recommended,
      love
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      'no-void': ['error', { allowAsStatement: true }],
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
      // Style-only rules from eslint-config-love that the codebase doesn't follow
      '@typescript-eslint/no-magic-numbers': 'off',
      'arrow-body-style': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      'no-negated-condition': 'off',
      // Structural rules from eslint-config-love that are stricter than the old standard-with-typescript
      complexity: 'off',
      'max-lines': 'off',
      '@typescript-eslint/max-params': 'off',
      'no-plusplus': 'off',
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/class-methods-use-this': 'off',
      'require-unicode-regexp': 'off'
    }
  }
)
