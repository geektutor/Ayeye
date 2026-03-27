/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@ayeye/eslint-config', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
  },
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    'react/react-in-jsx-scope': 'off', // not needed with React 17+ JSX transform
    'react/prop-types': 'off',         // using TypeScript instead
  },
}
