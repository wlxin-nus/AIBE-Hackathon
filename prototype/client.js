'use strict';
const $ = id => document.getElementById(id);
const phone = document.body.dataset.view === 'phone';
let room = new URLSearchParams(location.search).get('room') || '';
let session = null, position = null, watch = null, lastState = null;
let diagnostics = { secure: isSecureContext, bluetooth: 'bluetooth' in navigator, geolocation: 'geolocation' in navigator, status: 'not tested', accuracy: null };
$('room').value = room;
const status = message => { $('status').textContent = message; };
const profile = () => {
  const p = { minimum: Number($('minimum').value), preferred: Number($('preferred').value), maximum: Number($('maximum').value) };
  if (!Object.values(p).every(Number.isFinite) || p.minimum < 18 || p.maximum > 30 || p.minimum > p.preferred || p.preferred > p.maximum) throw new Error('Use 18–30 °C and keep minimum ≤ preferred ≤ maximum.');
  return p;
};
const api = async (route, body) => {
  const response = await fetch('/api/' + route, { method: body ? 'POST' : 'GET', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-Room-Code': room, ...(session ? { 'X-Participant-Token': session.token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) { if (response.status === 401 && phone) { session = null; sharing(false); } throw new Error(result.error); }
  return result;
};
function sharing(active) { $('connection').textContent = active ? 'Sharing with room' : 'Not sharing'; $('join').disabled = active; $('save').disabled = !active; $('leave').disabled = !active; $('alias').readOnly = active; $('room').readOnly = active; }
function svgElement(name, attributes) { const el = document.createElementNS('http://www.w3.org/2000/svg', name); for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value); return el; }
function draw(people) {
  $('markers').replaceChildren();
  for (const person of people) {
    if (!person.position) continue;
    const x = person.position.x * 1000, y = person.position.y * 600;
    for (const [radius, opacity] of [[72,.035],[54,.055],[36,.09],[20,.15],[8,1]]) $('markers').append(svgElement('circle', { cx:x, cy:y, r:radius, fill:person.colour, opacity }));
    const label = svgElement('text', { x:Math.min(900, Math.max(10,x+14)), y:Math.max(24,y-12), fill:'#203941', 'font-size':18, 'font-weight':600 });
    label.textContent = person.alias; $('markers').append(label);
  }
}
function render(state) {
  lastState = state;
  draw(state.participants);
  $('count').textContent = state.participants.length;
  $('empty').hidden = state.participants.some(p => p.position);
  $('people').replaceChildren();
  for (const p of state.participants) {
    const card = document.createElement('article'); card.className = 'person'; card.style.setProperty('--person', p.colour);
    const heading = document.createElement('h3'); heading.textContent = p.alias; card.append(heading);
    const lines = [`Prefers ${p.profile.preferred.toFixed(1)} °C · accepts ${p.profile.minimum}–${p.profile.maximum} °C`, p.position ? `Manual position: ${(p.position.x*100).toFixed(0)}%, ${(p.position.y*100).toFixed(0)}%` : 'Position not shared', `Last heartbeat ${Math.max(0,Math.floor((state.time-p.updatedAt)/1000))} s ago`, p.diagnostics ? `Location: ${p.diagnostics.status}` : 'Capabilities pending'];
    for (const text of lines) { const line = document.createElement('p'); line.textContent = text; card.append(line); }
    $('people').append(card);
  }
}
async function sync(body = {}) {
  if (!session) return;
  await api('update', { diagnostics, ...body });
  $('connection').textContent = 'Sharing with room';
}
function download(value, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type:'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}

if (!phone) {
  $('connect').onclick = () => { room = $('room').value.trim(); history.replaceState(null,'','/?room='+encodeURIComponent(room)); links(); poll(); };
  function links() { $('phone-link').href = '/phone?room='+encodeURIComponent(room); $('join-link').textContent = `Participant path: /phone?room=${room}. Use the laptop's LAN address on each phone.`; }
  async function poll() { if (!room) return status('Enter the room code from the server terminal.'); try { render(await api('state')); $('connection').textContent = 'Dashboard connected'; status(''); } catch (e) { $('connection').textContent = 'Connection lost'; status(e.message); } }
  links(); poll(); setInterval(poll, 1000);
} else {
  $('capabilities').textContent = `Secure context: ${diagnostics.secure ? 'yes' : 'no'} · Geolocation API: ${diagnostics.geolocation ? 'present' : 'absent'} · Bluetooth API: ${diagnostics.bluetooth ? 'present' : 'absent'}`;
  $('join-form').onsubmit = async event => {
    event.preventDefault(); room = $('room').value.trim();
    try { session = await api('join', { alias:$('alias').value, profile:profile(), consent:$('consent').checked }); sharing(true); await sync(); status('Joined. Tap the canvas to share a manual position.'); } catch (e) { status(e.message); }
  };
  $('save').onclick = async () => { try { await sync({profile:profile()}); status('Preferences saved.'); } catch(e) { status(e.message); } };
  $('export').onclick = () => { try { download({ schema:'common-climate-preferences/v1', units:'celsius', thermalComfort:profile() }, 'comfort-preferences.json'); status('Preference file prepared. Use Safari’s download or save controls if prompted.'); } catch(e) { status(e.message); } };
  $('plan').addEventListener('pointerdown', async event => {
    if (!session) return status('Join the room before sharing a position.');
    const svg = $('plan'), point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(svg.getScreenCTM().inverse());
    const next = { x:Math.min(1,Math.max(0,local.x/1000)), y:Math.min(1,Math.max(0,local.y/600)), source:'manual' };
    try { await sync({ position:next }); position = next; draw([{position,colour:'#177c86',alias:$('alias').value}]); $('position-label').textContent = `Manual position: ${(position.x*100).toFixed(0)}%, ${(position.y*100).toFixed(0)}%`; status('Position sent to the building dashboard.'); } catch(e) { status(e.message); }
  });
  function stopGps() { if (watch !== null) navigator.geolocation.clearWatch(watch); watch = null; $('gps').disabled = false; $('stop-gps').hidden = true; }
  $('gps').onclick = () => {
    if (!isSecureContext) { diagnostics.status = 'Blocked: trusted HTTPS required'; $('gps-result').textContent = 'This LAN page uses HTTP. iPhone Safari requires trusted HTTPS for geolocation. This is a browser security prerequisite, not evidence that indoor positioning passed or failed.'; sync().catch(e=>status(e.message)); return; }
    if (!navigator.geolocation) { $('gps-result').textContent = 'Geolocation is not available in this browser.'; return; }
    stopGps(); $('gps').disabled = true; $('stop-gps').hidden = false;
    let first = null, fixes = 0, maxDrift = 0;
    diagnostics.status = 'Waiting for location permission';
    // Raw coordinates remain in this browser; only accuracy/status reach the local server.
    // 原始经纬度留在当前浏览器；仅精度与状态发送到本地服务器。
    watch = navigator.geolocation.watchPosition(p => {
      const c = p.coords; first ||= {lat:c.latitude,lon:c.longitude}; fixes++;
      const north = (c.latitude-first.lat)*111320, east = (c.longitude-first.lon)*111320*Math.cos(first.lat*Math.PI/180);
      maxDrift = Math.max(maxDrift,Math.hypot(north,east));
      diagnostics.accuracy = c.accuracy; diagnostics.status = `GPS fixes ${fixes}; accuracy ±${c.accuracy.toFixed(1)} m`;
      $('gps-result').textContent = `Fixes: ${fixes}\nReported accuracy (95%): ±${c.accuracy.toFixed(1)} m\nRelative to first fix: east ${east.toFixed(1)} m, north ${north.toFixed(1)} m\nMaximum displacement: ${maxDrift.toFixed(1)} m\nDiagnostic only. No registered floor coordinates or VAV zone inferred.`;
      sync().catch(e=>status(e.message));
    }, e => { diagnostics.status = `GPS error ${e.code}: ${e.message}`; $('gps-result').textContent = diagnostics.status; sync().catch(err=>status(err.message)); stopGps(); }, {enableHighAccuracy:true,maximumAge:0,timeout:15000});
  };
  $('stop-gps').onclick = () => { stopGps(); diagnostics.status = 'GPS test stopped'; sync().catch(e=>status(e.message)); };
  $('leave').onclick = async () => { try { await api('leave', {}); session = null; position = null; stopGps(); sharing(false); draw([]); status('Sharing stopped. Your server record was removed.'); } catch(e) { status(e.message); } };
  setInterval(() => { if (session) sync().catch(e=>{ $('connection').textContent='Connection lost'; status(e.message); }); },5000);
}
