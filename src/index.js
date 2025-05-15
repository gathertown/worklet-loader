/* eslint-disable
  import/first,
  import/order,
  comma-dangle,
  linebreak-style,
  no-param-reassign,
  no-underscore-dangle,
  prefer-destructuring
*/
import path from 'path';

import schema from './options.json';
import { getOptions, interpolateName } from 'loader-utils';
import { validate } from 'schema-utils';

import getWorker from './worklets/';

export default function loader() {}

export function pitch(request) {
  this.cacheable(false);

  const options = getOptions(this) || {};

  validate(schema, options, {
    name: 'Worklet Loader',
    baseDataPath: 'options',
  });

  const { webpack } = this._compiler;
  const {
    EntryPlugin: SingleEntryPlugin,
    node: { NodeTargetPlugin },
  } = webpack;

  const cb = this.async();

  const filename = interpolateName(this, options.name || '[hash].worklet.js', {
    context: options.context || this.rootContext || this.options.context,
    regExp: options.regExp,
  });

  const worker = {};

  worker.options = {
    filename,
    chunkFilename: `[id].${filename}`,
    namedChunkFilename: null,
  };

  worker.compiler = this._compilation
    .createChildCompiler('worker', worker.options);

  // Tapable.apply is deprecated in tapable@1.0.0-x.
  // The plugins should now call apply themselves.
  // new WebWorkerTemplatePlugin(worker.options).apply(worker.compiler);

  if (this.target !== 'webworker' && this.target !== 'web') {
    new NodeTargetPlugin().apply(worker.compiler);
  }

  new SingleEntryPlugin(
    this.context,
    `!!${request}`,
    path.parse(this.resourcePath).name,
  ).apply(worker.compiler);

  const subCache = `subcache ${__dirname} ${request}`;

  worker.compilation = (compilation) => {
    if (compilation.cache) {
      if (!compilation.cache[subCache]) {
        compilation.cache[subCache] = {};
      }

      compilation.cache = compilation.cache[subCache];
    }
  };

  if (worker.compiler.hooks) {
    const plugin = { name: 'WorkletLoader' };

    worker.compiler.hooks.compilation.tap(plugin, worker.compilation);
  } else {
    worker.compiler.plugin('compilation', worker.compilation);
  }

  worker.compiler.runAsChild((err, entries, compilation) => {
    if (err) return cb(err);

    if (entries[0]) {
      const [workerFilename] = [...entries[0].files];

      worker.factory = getWorker(
        workerFilename,
        compilation.assets[workerFilename].source(),
        options
      );

      if (options.inline) {
        delete this._compilation.assets[workerFilename];
      }

      return cb(null, `module.exports = ${worker.factory};`);
    }

    return cb(null, null);
  });
}
