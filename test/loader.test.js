/* eslint-disable
  import/order,
  comma-dangle,
  arrow-parens,
  linebreak-style,
  prefer-destructuring,
  no-underscore-dangle,
  array-bracket-spacing,
*/
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import {
  compile,
  getCompiler
} from './helpers';

const readFile = file => fs.readFileSync(path.resolve(__dirname, file), 'utf-8');

test('should create chunk with worker', async () => {
  const compiler = getCompiler('worker');
  const stats = await compile(compiler);

  const files = stats.toJson().children
    .map(item => item.chunks)
    .reduce((acc, item) => acc.concat(item), [])
    .map(item => item.files)
    .map(item => `__expected__/worker/${item}`);

  assert.equal(files.length, 1);
  assert.notEqual(readFile(files[0]).indexOf('worker test mark'), -1);
});

test('should create chunk with specified name in query', async () => {
  const compiler = getCompiler('name-query');
  const stats = await compile(compiler);
  const files = stats.toJson().children
    .map(item => item.chunks)
    .reduce((acc, item) => acc.concat(item), [])
    .map(item => item.files)
    .map(item => `__expected__/name-query/${item}`);

  assert.equal(files[0], '__expected__/name-query/namedWorker.js');
  assert.notEqual(readFile(files[0]).indexOf('worker test mark'), -1);
});

test('should create named chunks with workers via options', async () => {
  const compiler = getCompiler('name-options', {
    loader: {
      test: /(w1|w2)\.js$/,
      options: {
        name: '[name].js',
      },
    }
  })
  const stats = await compile(compiler)
  const files = stats.toJson().children
    .map(item => item.chunks)
    .reduce((acc, item) => acc.concat(item), [])
    .map(item => item.files)
    .map(item => `__expected__/name-options/${item}`)
    .sort();

  assert.equal(files.length, 2);
  assert.equal(files[0], '__expected__/name-options/w1.js');
  assert.equal(files[1], '__expected__/name-options/w2.js');

  assert.notEqual(readFile(files[0]).indexOf('w1 via worker options'), -1);
  assert.notEqual(readFile(files[1]).indexOf('w2 via worker options'), -1);
});

test('should inline worker with inline option in query', async () => {
  const compiler = await getCompiler('inline-query')
  const stats = await compile(compiler)
  const files = stats.toJson().chunks
    .map(item => item.files)
    .reduce((acc, item) => acc.concat(item), [])
    .map(item => `__expected__/inline-query/${item}`);

  assert.equal(files.length, 1)
  assert.notEqual(readFile(files[0]).indexOf('inlined worker test mark'), -1)
});

test('should inline worker with inline in options', async () => {
  const compiler = await getCompiler('inline-options', {
    loader: {
      test: /(w1|w2)\.js$/,
      options: {
        inline: true,
      },
    }
  })
  const stats = await compile(compiler)
  const files = stats.toJson().chunks
    .map(item => item.files)
    .reduce((acc, item) => acc.concat(item), [])
    .map(item => `__expected__/inline-options/${item}`);

  assert.equal(files.length, 1);

  assert.notEqual(readFile(files[0]).indexOf('w1 inlined via options'), -1);
  assert.notEqual(readFile(files[0]).indexOf('w2 inlined via options'), -1);
});

test('should not add fallback chunks with inline', async () => {
  const compiler = getCompiler('no-fallbacks', {
    loader: {
      test: /(w1|w2)\.js$/,
      options: {
        inline: true,
      }
    }
  })
  const stats = await compile(compiler)
  const [ file ] = stats.toJson().chunks
    .map(item => item.files)
    .reduce((acc, item) => acc.concat(item), [])
    .map(item => `__expected__/no-fallbacks/${item}`);

  assert(file);
  assert.equal(fs.readdirSync(path.resolve(__dirname, '__expected__/no-fallbacks')).length, 1);
  assert.notEqual(readFile(file).indexOf('w1 inlined without fallback'), -1);
  assert.notEqual(readFile(file).indexOf('w2 inlined without fallback'), -1);
});

test('should use the publicPath option as the base URL if specified', async () => {
  const compiler = getCompiler('public-path-override', {
    loader: {
      options: {
        publicPath: '/some/proxy/',
      }
    }
  })
  const stats = await compile(compiler)
  const assets = stats.compilation.assets
  const worker = Object.keys(assets)[1];
  expect(readFile('__expected__/public-path-override/bundle.js')).toContain(
    `"/some/proxy/${worker}"`
  );
});
