/*
References:
- https://eslint.org/docs/latest/use/configure/configuration-files
- https://typescript-eslint.io/getting-started/typed-linting
*/

import { defineConfig } from 'eslint/config'
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
      tseslint.configs.recommendedTypeChecked
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
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }]
    }
  }
)
