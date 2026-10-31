'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, randomInt } = require('node:crypto');
const os = require('node:os');

const EXPIRES_MS = 20000;
const colours = ['#177c86', '#ad4d71', '#a76721', '#515cac'];
const error = (message, status = 400) => Object.assign(new Error(message), { status });
const finite = value => typeof value === 'number' && Number.isFinite(value);

function validateProfile(profile) {
  const p = profile || {};
  if (![p.preferred, p.minimum, p.maximum].every(finite) || p.minimum < 18 || p.maximum > 30 || p.minimum > p.preferred || p.preferred > p.maximum) {
    throw error('Use 18–30 °C and keep minimum ≤ preferred ≤ maximum.');
  }
  return { preferred: p.preferred, minimum: p.minimum, maximum: p.maximum };
}

function createProbe({ room = String(randomInt(100000, 1000000)), now = Date.now } = {}) {
  const people = new Map();
  const clean = () => { for (const [id, person] of people) if (now() - person.updatedAt >= EXPIRES_MS) people.delete(id); };
  const snapshot = () => {
    clean();
    return { time: now(), expiresMs: EXPIRES_MS, participants: [...people.values()].map(({ token, ...person }) => person) };
  };
  const send = (res, code, value) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
  const readBody = async req => {
    let body = '';
    for await (const chunk of req) { body += chunk; if (body.length > 8192) throw error('Request too large.', 413); }
    try { return JSON.parse(body); } catch { throw error('Expected JSON.'); }
  };
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname === '/health') return send(res, 200, { ok: true, purpose: 'two-device-position-probe' });
      if (url.pathname.startsWith('/api/')) {
        if (req.headers['x-room-code'] !== room) throw error('Enter the room code shown on the laptop.', 403);
        clean();
        if (req.method === 'GET' && url.pathname === '/api/state') return send(res, 200, snapshot());
        if (req.method === 'POST' && url.pathname === '/api/join') {
          const body = await readBody(req);
          if (body.consent !== true) throw error('Opt-in is required.');
          if (people.size >= 12) throw error('This test room is full.', 409);
          const alias = String(body.alias || '').trim().slice(0, 32);
          if (!alias) throw error('Enter an alias.');
          const profile = validateProfile(body.profile);
          const id = randomBytes(8).toString('hex');
          const token = randomBytes(24).toString('hex');
          const person = { id, token, alias, colour: colours[people.size % colours.length], profile, position: null, diagnostics: null, updatedAt: now() };
          people.set(id, person);
          return send(res, 201, { id, token });
        }
        const person = [...people.values()].find(p => p.token === req.headers['x-participant-token']);
        if (!person) throw error('Session expired. Join the room again.', 401);
        if (req.method === 'POST' && url.pathname === '/api/update') {
          const body = await readBody(req);
          const profile = body.profile ? validateProfile(body.profile) : person.profile;
          let position = person.position;
          if ('position' in body) {
            const p = body.position;
            if (p !== null && (!finite(p.x) || !finite(p.y) || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1 || p.source !== 'manual')) throw error('Invalid manual position.');
            position = p === null ? null : { x: p.x, y: p.y, source: 'manual' };
          }
          let diagnostics = person.diagnostics;
          if (body.diagnostics) {
            const d = body.diagnostics;
            diagnostics = { secure: d.secure === true, bluetooth: d.bluetooth === true, geolocation: d.geolocation === true, status: String(d.status || '').slice(0, 140), accuracy: finite(d.accuracy) && d.accuracy >= 0 ? d.accuracy : null };
          }
          Object.assign(person, { profile, position, diagnostics, updatedAt: now() });
          return send(res, 200, { ok: true, time: person.updatedAt });
        }
        if (req.method === 'POST' && url.pathname === '/api/leave') { people.delete(person.id); return send(res, 200, { ok: true }); }
        throw error('Not found.', 404);
      }
      const routes = {
        '/': ['index.html', 'text/html'], '/phone': ['phone.html', 'text/html'],
        '/style.css': ['style.css', 'text/css'], '/client.js': ['client.js', 'text/javascript'],
        '/comfort.css': ['comfort.css', 'text/css'], '/model.js': ['model.js', 'text/javascript'],
        '/concept': ['../design/comfort-concept.html', 'text/html']
      };
      const route = routes[url.pathname];
      if (req.method !== 'GET' || !route) throw error('Not found.', 404);
      const file = path.resolve(__dirname, route[0]);
      if (!fs.existsSync(file)) throw error('The design proposal is still being prepared.', 404);
      res.writeHead(200, { 'Content-Type': route[1] + '; charset=utf-8', 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    } catch (e) { if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'Server error.' }); else res.end(); }
  });
  return { server, room, snapshot };
}

// Only explicit static routes are served; personal session state stays in memory.
// 仅提供明确列出的静态文件；参与者会话数据只保存在内存中。
if (require.main === module) {
  const probe = createProbe({ room: process.env.COMFORT_ROOM || undefined });
  const port = Number(process.env.PORT || 4174);
  probe.server.listen(port, '0.0.0.0', () => {
    const addresses = Object.values(os.networkInterfaces()).flat().filter(a => a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.'));
    console.log(JSON.stringify({ room: probe.room, desktop: `http://localhost:${port}/?room=${probe.room}`, phone: addresses.map(a => `http://${a.address}:${port}/phone?room=${probe.room}`), note: 'LAN demo with manually reported positions. No HVAC commands are sent.' }, null, 2));
  });
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => probe.server.close(() => process.exit(0)));
}
module.exports = { createProbe, validateProfile, EXPIRES_MS };
