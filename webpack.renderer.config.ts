import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

rules.push({
    test: /\.s[ac]ss$/i,
    use: [
      // Creates `style` nodes from JS strings
      "style-loader",
      // Translates CSS into CommonJS
      "css-loader",
      //
      "resolve-url-loader",
      // Compiles Sass to CSS
      "sass-loader",
    ],
})

rules.push({
  test: /\.svg$/,
  use: ['@svgr/webpack'],
})

rules.push({
  test: /\.png$/,
  use: [{loader: 'raw-loader'}],
})

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};
