'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'files-age-'));
try {
  const oldFile = path.join(dir, 'older.txt');
  const newFile = path.join(dir, 'newer.txt');
  fs.writeFileSync(oldFile, 'old');
  fs.writeFileSync(newFile, 'new');
  fs.utimesSync(oldFile, new Date('2024-01-01T00:00:00Z'), new Date('2024-01-01T00:00:00Z'));
  fs.utimesSync(newFile, new Date('2025-01-01T00:00:00Z'), new Date('2025-01-01T00:00:00Z'));
  const run = (flag) => JSON.parse(execFileSync(process.execPath, ['index.js', flag, '--json', '--dir', dir], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' })).map(x => path.basename(x.file));
  assert.deepStrictEqual(run('--sort'), ['newer.txt', 'older.txt'], '--sort must list newest first');
  assert.deepStrictEqual(run('--reverse'), ['older.txt', 'newer.txt'], '--reverse must list oldest first');
  console.log('sort direction contract passes');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
