/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@ayeye/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  env: {
    node: true,
  },
}
