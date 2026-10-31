'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { parseArgs } = require('node:util');
const { randomUUID } = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const MODEL = 'claude-opus-5-5';

function redact(value) {
  let text = String(value ?? '');
  for (const [key, secret] of Object.entries(process.env)) {
    if (/TOKEN|SECRET|PASSWORD|API_KEY/i.test(key) && secret?.length >= 8) text = text.split(secret).join('[REDACTED]');
  }
  return text.replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, 'Bearer [REDACTED]')
    .replace(/\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{10,}/g, '[REDACTED]');
}

function inputPath(file) {
  const resolved = fs.realpathSync(path.resolve(ROOT, file));
  const relative = path.relative(ROOT, resolved);
  if (relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) throw new Error('Prompt files must stay inside the project.');
  if (!fs.statSync(resolved).isFile()) throw new Error('Prompt must be a file.');
  return resolved;
}

// Avoid a shell so arguments and stdin stay data; close stdin for headless runs.
// 不经过 Shell，确保参数和标准输入仅作为数据；无交互调用必须关闭标准输入。
function execute(executable, args, input, { timeoutMs, cwd = ROOT, env = process.env } = {}) {
  return new Promise(resolve => {
    const started = Date.now();
    let stdout = '', stderr = '', timedOut = false, spawnError = null;
    const child = spawn(executable, args, { cwd, env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
    // An early exit (for example, missing authentication) may close stdin first.
    // 子进程提前退出（例如未登录）时，标准输入可能先被关闭。
    child.stdin.on('error', () => {});
    child.on('error', error => { spawnError = error.message; });
    child.on('close', code => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut, spawnError, durationMs: Date.now() - started });
    });
    child.stdin.end(input, 'utf8');
  });
}

function summarize(run) {
  const events = run.stdout.split(/\r?\n/).filter(Boolean).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  const final = events.findLast(e => e.type === 'result');
  const init = events.find(e => e.type === 'system' && e.subtype === 'init');
  const response = typeof final?.result === 'string' ? final.result : '';
  const apiRetries = events.filter(e => e.type === 'system' && e.subtype === 'api_retry');
  const retryError = apiRetries.at(-1)?.error;
  const upstreamError = retryError ? redact(typeof retryError === 'string' ? retryError : JSON.stringify(retryError)) : null;
  const errors = [...(final?.errors || []), run.stderr, run.spawnError, final?.is_error ? response : '', upstreamError].filter(Boolean).join('\n');
  let status = 'process_error';
  if (run.timedOut) status = 'timeout';
  else if (run.code === 0 && final?.subtype === 'success' && !final.is_error && response.trim()) status = 'success';
  else if (/not logged in|authentication|unauthorized|invalid.*(?:key|token)|login required|please.*login|401/i.test(errors)) status = 'auth_error';
  else if (/model.*(?:not found|not available|not supported|invalid)|unknown model/i.test(errors)) status = 'model_error';
  else if (/overloaded|529/i.test(errors)) status = 'service_overloaded';
  else if (/rate.?limit|usage limit|429/i.test(errors)) status = 'rate_limited';
  else if (final) status = 'model_error';
  const usedModels = Object.keys(final?.modelUsage || {});
  const reportedModel = init?.model || null;
  if (status === 'success' && ((reportedModel && reportedModel !== MODEL) || usedModels.some(m => !m.startsWith(MODEL)))) status = 'model_mismatch';
  if (status === 'success' && !reportedModel && usedModels.length === 0) status = 'model_unverified';
  return { status, exitCode: run.code, durationMs: run.durationMs, requestedModel: MODEL, reportedModel, usedModels, response: redact(response), error: redact(errors), upstreamError, apiRetryCount: apiRetries.length, eventCount: events.length };
}

async function main() {
  const { values } = parseArgs({ options: {
    'prompt-file': { type: 'string' }, 'task-id': { type: 'string' },
    'timeout-seconds': { type: 'string', default: '180' }, mode: { type: 'string', default: 'isolated' },
    'claude-executable': { type: 'string' }, 'frontend-design': { type: 'boolean', default: false }
  } });
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(values['task-id'] || '')) throw new Error('Invalid task ID.');
  if (!['isolated', 'normal'].includes(values.mode)) throw new Error('Invalid invocation mode.');
  const timeoutSeconds = Number(values['timeout-seconds']);
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 1 || timeoutSeconds > 180) throw new Error('Timeout must be 1–180 seconds.');
  const promptFile = inputPath(values['prompt-file']);
  const prompt = fs.readFileSync(promptFile, 'utf8');
  if (!prompt.trim()) throw new Error('Prompt is empty.');
  const outputDir = path.join(ROOT, 'outputs', 'claude', `${values['task-id']}-${Date.now()}-${randomUUID().slice(0, 8)}`);
  fs.mkdirSync(outputDir, { recursive: true });
  const tempDir = path.join(ROOT, '.cache', 'tmp');
  fs.mkdirSync(tempDir, { recursive: true });
  let instructions = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
  if (values['frontend-design']) instructions += '\n\n' + fs.readFileSync(path.join(ROOT, '.claude', 'skills', 'frontend-design', 'SKILL.md'), 'utf8');
  const args = ['-p', '--output-format', 'stream-json', '--verbose', '--model', MODEL, '--effort', 'medium', '--tools', '', '--strict-mcp-config', '--no-session-persistence', '--permission-prompts', 'none', '--append-system-prompt', instructions];
  if (values.mode === 'isolated') args.push('--safe-mode');
  const run = await execute(values['claude-executable'] || 'claude', args, prompt, {
    timeoutMs: timeoutSeconds * 1000,
    env: { ...process.env, TMP: tempDir, TEMP: tempDir, TMPDIR: tempDir, DISABLE_AUTOUPDATER: '1' }
  });
  const result = { ...summarize(run), taskId: values['task-id'], mode: values.mode, frontendDesign: values['frontend-design'], completedAt: new Date().toISOString(), outputDir };
  if (result.status === 'timeout') result.error = `No completed answer within ${timeoutSeconds}s. CLI startup alone is not a successful connection.\n${result.error}`.trim();
  fs.writeFileSync(path.join(outputDir, 'events.jsonl'), redact(run.stdout));
  fs.writeFileSync(path.join(outputDir, 'stderr.log'), redact(run.stderr));
  fs.writeFileSync(path.join(outputDir, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  if (result.status === 'success') fs.writeFileSync(path.join(outputDir, 'response.md'), result.response + '\n');
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exitCode = result.status === 'success' ? 0 : 1;
}

module.exports = { execute, summarize, redact, inputPath };
if (require.main === module) main().catch(error => {
  process.stderr.write(JSON.stringify({ status: 'configuration_error', error: redact(error.message) }) + '\n');
  process.exitCode = 1;
});
