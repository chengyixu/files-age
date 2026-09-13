'use strict';
const assert = require('assert');
const pkg = require('../package.json');
assert.strictEqual(pkg.version, '1.0.3', 'CLI validation repair must ship as a new patch version');
console.log('release version contract passes');
