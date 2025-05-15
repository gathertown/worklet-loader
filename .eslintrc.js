/**
 * ESLint configuration array extending the 'webpack' configuration.
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  extends: ["@webpack-contrib/eslint-config-webpack"],
  ignorePatterns: [
    'test/fixtures',
    'test/__expected__',
    'src/worklets/InlineWorklet.js',
    '/node_modules',
    '/dist'
  ]
}
