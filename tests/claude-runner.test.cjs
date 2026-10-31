'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { execute, summarize, redact, inputPath } = require('../scripts/claude-runner.cjs');
const event = value => JSON.stringify(value) + '\n';
const resultEvent = { type: 'result', subtype: 'success', is_error: false, result: 'CODEX_CLAUDE_OK', modelUsage: { 'claude-opus-5-5': {} } };

test('stdin is closed, literal prompt survives, and completed response is required', async () => {
  const code = `let input=''; process.stdin.setEncoding('utf8').on('data', x=>input+=x).on('end',()=>console.log(JSON.stringify({...${JSON.stringify(resultEvent)},result:input})));`;
  // Keep Chinese UTF-8 coverage alongside literal shell metacharacters.
  // 保留中文 UTF-8 覆盖，同时验证 Shell 特殊字符按原样传递。
  const prompt = '\u4e2d\u6587 space $() ` literal\nsecond line';
  const run = await execute(process.execPath, ['-e', code], prompt, { timeoutMs: 3000 });
  assert.equal(summarize(run).status, 'success');
  assert.equal(summarize(run).response, prompt);
  assert.equal(summarize({ ...run, stdout: event({ type: 'system', subtype: 'init', model: 'claude-opus-5-5' }) }).status, 'process_error');
});

test('a hung process is terminated within the configured deadline', async () => {
  const run = await execute(process.execPath, ['-e', 'setInterval(()=>{},1000)'], '', { timeoutMs: 150 });
  assert.equal(summarize(run).status, 'timeout');
  assert.ok(run.durationMs < 3000);
});

test('authentication, model and quota failures are not reported as success', () => {
  for (const [message, status] of [['Authentication failed: 401', 'auth_error'], ['Unknown model', 'model_error'], ['Usage limit reached: 429', 'rate_limited']]) {
    assert.equal(summarize({ stdout: event({ type: 'result', subtype: 'error_during_execution', is_error: true, result: message }), stderr: '', code: 1 }).status, status);
  }
  assert.equal(summarize({ stdout: event(resultEvent), stderr: '', code: 1 }).status, 'model_error');
  assert.equal(summarize({ stdout: event({ ...resultEvent, modelUsage: { 'claude-sonnet': {} } }), stderr: '', code: 0 }).status, 'model_mismatch');
  assert.equal(summarize({ stdout: event({ ...resultEvent, modelUsage: {} }), stderr: '', code: 0 }).status, 'model_unverified');
});

test('process startup failure returns a useful result', async () => {
  const run = await execute('nonexistent-hackathon-command-xyz', [], '', { timeoutMs: 1000 });
  assert.equal(summarize(run).status, 'process_error');
  assert.ok(run.spawnError);
});

test('overload retries remain visible and a recovered request can succeed', () => {
  const retry = event({ type: 'system', subtype: 'api_retry', error: 'overloaded' });
  const failed = summarize({ stdout: retry, stderr: '', code: null, timedOut: true });
  assert.equal(failed.status, 'timeout');
  assert.equal(failed.upstreamError, 'overloaded');
  assert.equal(failed.apiRetryCount, 1);
  assert.equal(summarize({ stdout: retry, stderr: 'API Error: 529 Overloaded', code: 1 }).status, 'service_overloaded');
  assert.equal(summarize({ stdout: retry + event(resultEvent), stderr: '', code: 0 }).status, 'success');
});

test('diagnostics redact credentials and prompt paths cannot escape the project', () => {
  assert.equal(redact('Bearer secret.token-value sk-ant-abcdefghijklmnopqrstuvwxyz'), 'Bearer [REDACTED] [REDACTED]');
  assert.throws(() => inputPath('../hackson_Yuqian/../../../../../../Windows/win.ini'));
  assert.ok(inputPath('tasks/ping.md').endsWith('ping.md'));
});
