'use strict';
// Temporary environment check only: no application scaffold or dependencies.
// 仅用于临时环境检查，不创建应用脚手架，也不引入依赖。
const http = require('node:http');
const page = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hackathon Environment Check</title><style>body{font:18px system-ui,sans-serif;margin:8vh auto;padding:24px;max-width:720px;background:#f3f5f0;color:#183c35}main{background:white;border:1px solid #d9e2dc;padding:32px;border-radius:16px}button{font:inherit;background:#183c35;color:white;border:0;border-radius:8px;padding:12px 20px;cursor:pointer}p{line-height:1.7}output{display:block;margin-top:24px;font-weight:600}</style><main><p>Hackathon · Environment check</p><h1>Local Web Environment Check</h1><p>This is a temporary tool-check page. Click the button to verify browser control and page interaction.</p><button id="verify" type="button">Verify browser interaction</button><output id="result" aria-live="polite">Waiting for verification / WAITING</output></main><script>document.getElementById('verify').addEventListener('click',()=>{document.getElementById('result').textContent='Browser interaction passed / BROWSER_CONTROL_OK';});</script></html>`;
const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ status: 'ok', purpose: 'environment-check' })); }
  if (req.url !== '/') { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(page);
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(4173, '127.0.0.1', () => console.log('Environment check: http://127.0.0.1:4173 (Ctrl+C to stop)'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
