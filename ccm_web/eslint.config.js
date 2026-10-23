/*
References:
- https://eslint.org/docs/latest/use/configure/configuration-files
- https://typescript-eslint.io/getting-started/typed-linting
*/

import stylistic from '@stylistic/eslint-plugin'
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
      tseslint.configs.recommended
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
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      'no-void': ['error', { allowAsStatement: true }],
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      // Existing code style: no semicolons, single quotes, 2-space indent
      '@stylistic/semi': ['error', 'never'],
      // Multi-line interface/type members have no delimiter; single-line ones use ,
      '@stylistic/member-delimiter-style': ['error', {
        multiline: { delimiter: 'none', requireLast: false },
        singleline: { delimiter: 'comma', requireLast: false }
      }],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      // JSX indentation is ignored, as in standard-with-typescript
      '@stylistic/indent': ['error', 2, {
        SwitchCase: 1,
        ignoredNodes: ['JSXElement', 'JSXElement > *', 'JSXAttribute', 'JSXIdentifier', 'JSXNamespacedName', 'JSXMemberExpression', 'JSXSpreadAttribute', 'JSXExpressionContainer', 'JSXOpeningElement', 'JSXClosingElement', 'JSXFragment', 'JSXOpeningFragment', 'JSXClosingFragment', 'JSXText', 'JSXEmptyExpression', 'JSXSpreadChild']
      }]
    }
  }
)
