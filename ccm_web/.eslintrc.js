/*
References:
- https://github.com/standard/eslint-config-standard-with-typescript
- https://www.robertcooper.me/using-eslint-and-prettier-in-a-typescript-project
- https://www.carlrippon.com/using-eslint-with-typescript/
*/

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    ecmaFeatures: {
      jsx: true
    },
    sourceType: 'module',
    tsconfigRootDir: './ccm_web',
    project: [
      './tsconfig.json', // Server
      './client/tsconfig.json' // Client
    ]
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  settings: {
    react: {
      version: 'detect'
    }
  },
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'standard-with-typescript'
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'no-void': ['error', { 'allowAsStatement': true }],
    '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }]
  }

}
