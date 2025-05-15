/* eslint-disable
  import/order,
  comma-dangle,
  arrow-parens,
  multiline-ternary,
  no-param-reassign
*/
import fs from 'fs';
import path from 'path';
import webpack from 'webpack';

export default function (name, config = {}) {
  // Delete the output directory before running webpack
  const outputDir = path.resolve(__dirname, `../__expected__/${name}`);
  fs.rmSync(outputDir, { recursive: true, force: true });

  config = {
    target: config.target || 'web',
    context: path.resolve(__dirname, '../fixtures'),
    entry: path.resolve(__dirname, `../fixtures/${name}/entry.js`),
    output: {
      path: outputDir,
      filename: 'bundle.js',
    },
    optimization: {
      // To keep filename consistent
      chunkIds: 'deterministic',
    },
    module: {
      rules: [
        {
          test: config.loader ? config.loader.test : /worker\.js$/,
          use: {
            loader: path.resolve(__dirname, '../../src'),
            options: config.loader ? config.loader.options : {}
          }
        }
      ]
    }
  };

  return webpack(config)
}
