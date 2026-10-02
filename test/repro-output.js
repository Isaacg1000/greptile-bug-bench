'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repro = path.join(__dirname, 'repro.js');

function run(args) {
  const result = spawnSync(process.execPath, [repro, ...args], {
    encoding: 'utf8'
  });
  assert.ifError(result.error);
  assert.strictEqual(result.stderr, '');
  return result;
}

const human = run([]);
const json = run(['--json']);
const report = JSON.parse(json.stdout);

assert.strictEqual(json.status, human.status);
assert.ok(Array.isArray(report.results));
assert.deepStrictEqual(
  Object.keys(report.summary).sort(),
  ['failed', 'passed', 'total']
);
assert.strictEqual(report.summary.total, report.results.length);
assert.strictEqual(
  report.summary.passed,
  report.results.filter((result) => result.status === 'passed').length
);
assert.strictEqual(
  report.summary.failed,
  report.results.filter((result) => result.status === 'failed').length
);
for (const result of report.results) {
  assert.ok(result.name);
  assert.ok(['passed', 'failed'].includes(result.status));
  if (result.status === 'failed') {
    assert.ok(result.error);
  } else {
    assert.strictEqual(Object.hasOwn(result, 'error'), false);
  }
}

const humanLines = report.results.map((result) => result.status === 'passed'
  ? `PASS  ${result.name}`
  : `FAIL  ${result.name}\n      ${result.error}`);
const expectedHumanOutput = `${humanLines.join('\n')}\n\n` +
  `${report.summary.passed} passed, ${report.summary.failed} failed\n`;
assert.strictEqual(human.stdout, expectedHumanOutput);

console.log('Repro output formats are consistent.');
