const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'menu-action': './src/menu-action.js',
    'bulk-export': './src/bulk-export.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/*.html', to: '[name][ext]' }
      ]
    })
  ],
  resolve: {
    extensions: ['.js'],
    fallback: {
      "path": false,
      "fs": false
    }
  },
  mode: 'production',
  optimization: {
    minimize: false
  },
  devtool: 'source-map'
};