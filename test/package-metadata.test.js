'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
assert.strictEqual(pkg.bin['files-age'], 'index.js', 'bin must use npm-normalized entry path');
assert.strictEqual(pkg.repository.url, 'git+https://github.com/chengyixu/files-age.git', 'repository must use the canonical git URL');
console.log('publish metadata contract passes');
