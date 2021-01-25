const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const HookShellScriptPlugin = require('hook-shell-script-webpack-plugin');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

// NOTE(zviad): This is ultimate HAX, to workaround the issue that 'webpack-asset-relocator-loader'
// seems to generate incorrect paths for native_modules for renderer code.
plugins.push(new HookShellScriptPlugin({
  afterEmit: ['ln -sf renderer/native_modules .webpack/native_modules'],
}))

module.exports = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css']
  },
};
