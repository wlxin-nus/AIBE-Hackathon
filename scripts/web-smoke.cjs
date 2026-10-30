'use strict';
// Temporary environment check only: no application scaffold or dependencies.
const http = require('node:http');
const page = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hackathon Environment Check</title><style>body{font:18px system-ui,sans-serif;margin:8vh auto;padding:24px;max-width:720px;background:#f3f5f0;color:#183c35}main{background:white;border:1px solid #d9e2dc;padding:32px;border-radius:16px}button{font:inherit;background:#183c35;color:white;border:0;border-radius:8px;padding:12px 20px;cursor:pointer}p{line-height:1.7}output{display:block;margin-top:24px;font-weight:600}</style><main><p>Hackathon · Environment check</p><h1>本机网页环境检查</h1><p>这是临时工具测试页。点击按钮验证浏览器操作与页面交互。</p><button id="verify" type="button">验证浏览器交互</button><output id="result" aria-live="polite">等待验证 / WAITING</output></main><script>document.getElementById('verify').addEventListener('click',()=>{document.getElementById('result').textContent='浏览器交互通过 / BROWSER_CONTROL_OK';});</script></html>`;
const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ status: 'ok', purpose: 'environment-check' })); }
  if (req.url !== '/') { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(page);
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(4173, '127.0.0.1', () => console.log('Environment check: http://127.0.0.1:4173 (Ctrl+C to stop)'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
