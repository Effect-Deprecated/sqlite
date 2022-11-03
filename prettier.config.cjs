/** @type {import("prettier").Config} */
module.exports = {
  bracketSpacing: false,
  printWidth: 80,
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  plugins: [require.resolve('prettier-plugin-tailwindcss')],
}
