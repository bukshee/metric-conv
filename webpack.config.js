const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  devtool: 'inline-source-map',
  entry: './src/popup.ts',
  output: {
    filename: 'extension/bundle.js'
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js']
  },
  plugins: [
    new UglifyJsPlugin()
  ],
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  }
}