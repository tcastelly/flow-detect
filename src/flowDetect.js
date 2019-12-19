const fs = require('fs');
const { promisify } = require('util');
const { join } = require('path');

const readDirAsync = promisify(fs.readdir);
const statsAsync = promisify(fs.stat);

const parseApp = async (path, done) => {
  let results = [];

  let p;
  if (!done) {
    let finalResolve;
    p = new Promise((resolve) => {
      finalResolve = resolve;
    });
    done = (res) => finalResolve(res);
  }

  const items = await readDirAsync(path);

  let pending = items.length;
  if (!pending) {
    done(results);
  }

  // retrieve stats for all items
  const itemsStats = items.map(async (item) => {
    const _path = `${path}/${item}`;
    const stats = await statsAsync(_path);
    return { stats, path: _path };
  });


  // recursive call for folders
  (await Promise.all(itemsStats)).forEach((item) => {
    if (item.stats.isFile()) {
      const posExt = item.path.lastIndexOf('.');
      if (posExt > -1 && ['js', 'flow'].indexOf(item.path.substr(posExt + 1)) > -1) {
        results.push(item.path);
      }

      pending -= 1;
      if (!pending && done) {
        done(results);
      }
    } else if (item.stats.isDirectory()) {
      parseApp(item.path, (res) => {
        results = results.concat(res);

        pending -= 1;
        if (!pending && done) {
          done(results);
        }
      });
    }
  });

  return p;
};

const getFilesWithoutFlow = async (jsFiles) => {
  const filesReading = (jsFiles || []).map((file) => new Promise((resolve, reject) => {
    const rs = fs.createReadStream(file, { encoding: 'utf8' });
    let acc = '';
    let pos = 0;
    let line = '';

    rs
      .on('data', (chunk) => {
        const index = chunk.indexOf('\n');
        acc += chunk;
        if (index === -1) {
          pos += chunk.length;
        } else {
          pos += index;

          line = acc.slice(acc.charCodeAt(0) === 0xFEFF ? 1 : 0, pos).trim();

          // get next line only for that case
          if (line === '#!/usr/bin/env node') {
            const secondLineIndex = chunk.indexOf('\n', index + 1);
            acc += chunk;

            line = acc.slice(index, secondLineIndex).trim();
          }
          rs.close();
        }
      })
      .on('close', () => resolve({
        line,
        file,
      }))
      .on('error', (_err) => reject(_err));
  }));

  return (await Promise.all(filesReading))
    .filter((firstLine) => firstLine.line !== '// @flow')
    .map((firstLine) => firstLine.file);
};

module.exports = function () {
  // Print files without `// @flow`
  const root = join(process.cwd(), process.argv.length > 2 ? process.argv[2] : '.');

  return new Promise((resolve) => {
    parseApp(root)
      .then(getFilesWithoutFlow)
      .then((fileToUpdate) => {
        if (fileToUpdate.length > 0) {
          console.error(fileToUpdate);
          console.error(`${fileToUpdate.length} errors`);
          resolve();
          process.exit(1);
        } else {
          resolve();
          process.exit(0);
        }
      });
  });
};
