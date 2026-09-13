'use strict';
const assert = require('assert');
const { spawnSync } = require('child_process');
const path = require('path');
const result = spawnSync(process.execPath, ['index.js', '--typo-option'], {
  cwd: path.join(__dirname, '..'), encoding: 'utf8'
});
assert.notStrictEqual(result.status, 0, 'unknown option must fail');
assert.match(result.stderr, /unknown option: --typo-option/, 'error must name the rejected option');
console.log('unknown option contract passes');
