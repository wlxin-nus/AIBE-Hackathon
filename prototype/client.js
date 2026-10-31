'use strict';
const $ = id => document.getElementById(id);
const phone = document.body.dataset.view === 'phone';
const model = window.ComfortModel;
let room = new URLSearchParams(location.search).get('room') || '';
let session = null, position = null, pollVersion = 0;
$('room').value = room;
const status = message => { $('status').textContent = message; };
function profile() {
  const p = { minimum: Number($('minimum').value), preferred: Number($('preferred').value), maximum: Number($('maximum').value) };
  if (['minimum','preferred','maximum'].some(k => !$(k).value.trim()) || !Object.values(p).every(Number.isFinite) || p.minimum < 18 || p.maximum > 30 || p.minimum > p.preferred || p.preferred > p.maximum) throw new Error('Use 18–30 °C with minimum ≤ preferred ≤ maximum.');
  return p;
}
async function api(route, body) {
  const response = await fetch('/api/' + route, { method: body ? 'POST' : 'GET', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-Room-Code': room, ...(session ? { 'X-Participant-Token': session.token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && phone) { session = null; position = null; sharing(false); drawSelf(); }
    throw new Error(result.error);
  }
  return result;
}
function sharing(active) {
  $('connection').textContent = active ? 'Sharing with room' : 'Not sharing';
  $('join').disabled = active; $('save').disabled = !active; $('leave').disabled = !active;
  $('alias').readOnly = active; $('room').readOnly = active;
  document.querySelectorAll('[data-seat]').forEach(b => { b.disabled = !active; });
  if (!active) $('position-label').textContent = 'Join the room to choose a seat.';
}
function drawSelf() {
  model.setParticipants(position ? [{ position, colour: '#ad4d71', alias: $('alias').value }] : []);
  const seat = model.seatFor(position);
  document.querySelectorAll('[data-seat]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.seat === seat?.id)));
}
async function sync(body = {}) {
  if (!session) throw new Error('Join the room before sharing.');
  await api('update', body);
  $('connection').textContent = 'Sharing with room';
}
function download(value, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type:'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function paragraph(parent, text) { const p = document.createElement('p'); p.textContent = text; parent.append(p); }
function renderState(state) {
  const people = state.participants;
  model.setParticipants(people);
  $('count').textContent = people.length;
  $('placed-count').textContent = people.filter(p => p.position).length;
  $('empty').hidden = people.length > 0;
  $('people').replaceChildren();
  for (const p of people) {
    const card = document.createElement('article'); card.className = 'person'; card.style.setProperty('--person', p.colour);
    const h = document.createElement('h3'); h.textContent = p.alias; card.append(h);
    const seat = model.seatFor(p.position), unit = model.nearestFCU(p.position);
    paragraph(card, 'Prefers ' + p.profile.preferred.toFixed(1) + ' °C · accepts ' + p.profile.minimum + '–' + p.profile.maximum + ' °C');
    paragraph(card, p.position ? (seat ? 'Seat ' + seat.id : 'Manual position') + ' · FCU ' + String(unit + 1).padStart(2,'0') + ' group' : 'Choosing a seat');
    $('people').append(card);
  }
  let conflicts = 0;
  $('fcu-grid').replaceChildren();
  model.fcus.forEach((_,i) => {
    const group = people.filter(p => model.nearestFCU(p.position) === i);
    const lower = Math.max(...group.map(p => p.profile.minimum));
    const upper = Math.min(...group.map(p => p.profile.maximum));
    const conflict = group.length > 0 && lower > upper;
    if (conflict) conflicts++;
    const card = document.createElement('article'); card.className = 'fcu-card' + (conflict ? ' conflict' : '');
    const h = document.createElement('h3'); h.textContent = 'FCU ' + String(i+1).padStart(2,'0'); card.append(h);
    const value = document.createElement('strong');
    // Clamp the mean preference to the shared interval; never resolve conflicts silently. 将平均偏好限制在共同区间内；冲突必须明确显示。
    const suggested = group.length && !conflict ? Math.min(upper, Math.max(lower, group.reduce((sum,p) => sum + p.profile.preferred,0)/group.length)) : null;
    value.textContent = !group.length ? '—' : conflict ? 'Review needed' : suggested.toFixed(1) + ' °C';
    card.append(value);
    paragraph(card, group.length ? group.length + (group.length === 1 ? ' participant' : ' participants') : 'No seated participants');
    paragraph(card, !group.length ? 'No suggestion' : conflict ? 'Acceptable ranges do not overlap.' : 'Shared range ' + lower + '–' + upper + ' °C');
    $('fcu-grid').append(card);
  });
  $('conflict-count').textContent = conflicts;
}
if (!phone) {
  function links() {
    $('phone-link').href = '/phone?room=' + encodeURIComponent(room);
    $('join-link').textContent = room ? 'Room ' + room + ' · Open the participant link using this laptop’s LAN address on your phone.' : 'Use the room code printed by the local server.';
  }
  async function poll() {
    const version = pollVersion;
    if (!room) return status('Enter the room code printed by the local server.');
    try { const state = await api('state'); if (version !== pollVersion) return; renderState(state); $('connection').textContent = 'Live · connected'; status(''); }
    catch (e) { if (version !== pollVersion) return; $('connection').textContent = 'Disconnected'; status(e.message); renderState({participants:[]}); }
  }
  $('connect').onclick = () => { room = $('room').value.trim(); pollVersion++; history.replaceState(null,'','/?room='+encodeURIComponent(room)); links(); poll(); };
  renderState({participants:[]}); links(); poll(); setInterval(poll, 1000);
} else {
  for (const seat of model.seats) {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.seat = seat.id;
    button.textContent = seat.id; button.setAttribute('aria-label', 'Select seat ' + seat.id); button.setAttribute('aria-pressed','false'); button.disabled = true;
    button.onclick = async () => {
      if (!session) return status('Join the room before choosing a seat.');
      const next = { x:seat.x/1700, y:seat.y/1100, source:'manual' };
      try { await sync({position:next}); position=next; drawSelf(); $('position-label').textContent='Seat ' + seat.id + ' · manually selected · FCU ' + String(model.nearestFCU(position)+1).padStart(2,'0') + ' group'; status('Your seat is shared with the dashboard.'); }
      catch(e) { status(e.message); }
    };
    $('seat-grid').append(button);
  }
  $('join-form').onsubmit = async event => {
    event.preventDefault(); room = $('room').value.trim(); $('join').disabled = true;
    try { session = await api('join', {alias:$('alias').value,profile:profile(),consent:$('consent').checked}); sharing(true); status('Joined. Choose your seat below.'); $('position-label').textContent='Select a seat to place yourself in the classroom.'; }
    catch(e) { sharing(false); status(e.message); }
  };
  $('save').onclick = async () => { try { await sync({profile:profile()}); status('Preferences saved.'); } catch(e) { status(e.message); } };
  $('export').onclick = () => { try { download({schema:'common-climate-preferences/v1',units:'celsius',thermalComfort:profile()},'comfort-preferences.json'); status('Preference file prepared.'); } catch(e) { status(e.message); } };
  $('leave').onclick = async () => { try { await api('leave',{}); session=null; position=null; sharing(false); drawSelf(); status('Sharing stopped. Your record was removed.'); } catch(e) { status(e.message); } };
  setInterval(() => { if(session) sync().catch(e => { $('connection').textContent='Connection lost'; status(e.message); }); },5000);
}
