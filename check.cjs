const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');

const control = spawnSync(process.execPath, ['repro.cjs', '--keep-attached'], {encoding: 'utf8'});
assert.equal(control.status, 0, control.stderr);
assert.match(control.stdout, /Control passed/);

const failure = spawnSync(process.execPath, ['repro.cjs'], {encoding: 'utf8'});
assert.equal(failure.status, 1, failure.stderr);
assert.match(failure.stderr, /TypeError: Cannot read properties of null \(reading 'addListener'\)/);
assert.match(failure.stderr, /at createDeckInstance/);
assert.match(failure.stderr, /at GoogleMapsOverlay\._onAddVectorOverlay/);
console.log('Verified: attached control passes; finalization followed by the captured callback throws null.addListener.');
