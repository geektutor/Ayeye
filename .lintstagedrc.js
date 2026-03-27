/** @type {import('lint-staged').Config} */
module.exports = {
  '**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '**/*.{js,json,md}': ['prettier --write'],
}
