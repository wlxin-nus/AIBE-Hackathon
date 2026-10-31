'use strict';
const $ = id => document.getElementById(id);
const phone = document.body.dataset.view === 'phone';
const model = window.ComfortModel;
let room = new URLSearchParams(location.search).get('room') || '';
let session = null, position = null, pollVersion = 0, roomPeople = [];
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
  $('seat-select').disabled = !active;
  window.ComfortPlan.setEnabled(active);
  if (!active) $('position-label').textContent = 'Join the room to choose a seat.';
}
function drawSelf() {
  const others = session ? roomPeople.filter(p=>p.id!==session.id) : [];
  model.setParticipants(position&&session ? [...others,{id:session.id,position,profile:session.profile,colour:session.colour||'#177c86',alias:$('alias').value}] : others);
  const seat=model.seatFor(position);
  $('seat-select').value=seat?.id||'';
  window.ComfortPlan.setSelected(seat?.id||null);
  if(position&&session){const zone=model.getZones()[model.nearestFCU(position)];$('position-label').textContent='Seat '+(seat?.id||'manual')+' · FCU '+String(model.nearestFCU(position)+1).padStart(2,'0')+' · '+zone.target.toFixed(1)+' °C simulated'+(zone.conflict?' · Comfort conflict: provisional compromise, review required.':' · Shared acceptable range '+zone.lower+'–'+zone.upper+' °C');}
}
async function refreshPhone(){
  if(!session)return;
  const id=session.id,state=await api('state');
  if(!session||id!==session.id)return;
  roomPeople=state.participants;
  const own=roomPeople.find(p=>p.id===session.id);
  if(own){session.profile=own.profile;session.colour=own.colour;}
  drawSelf();
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
    const zone = model.getZones()[i], group=zone.members, {lower,upper,conflict}=zone;
    if (conflict) conflicts++;
    const card = document.createElement('article'); card.className = 'fcu-card' + (conflict ? ' conflict' : '');
    const h = document.createElement('h3'); h.textContent = 'FCU ' + String(i+1).padStart(2,'0'); card.append(h);
    const value = document.createElement('strong');value.textContent=zone.target.toFixed(1)+' °C';card.append(value);
    card.style.borderTop='4px solid '+window.ComfortThermal.colour(zone.target);
    paragraph(card,zone.idle?'Scenario baseline · no occupants':group.length+' participant'+(group.length===1?'':'s'));
    paragraph(card,zone.idle?'25 °C assumed baseline':conflict?'Provisional compromise · '+zone.unmet+' outside their acceptable range':'Shared range '+lower+'–'+upper+' °C');
    if(conflict)paragraph(card,'Conflict: lower limit '+lower+' °C exceeds upper limit '+upper+' °C. Review required.');
    if(!zone.idle)paragraph(card,group.map(p=>p.alias+': '+p.profile.preferred+' °C preferred').join(' · '));
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
  for(const seat of model.seats){const option=document.createElement('option');option.value=seat.id;option.textContent='Desk '+seat.id.slice(0,2)+' · seat '+seat.id.slice(-1);$('seat-select').append(option);}
  let choosing=false;
  async function selectSeat(seat){
    if(!session)return status('Join the room before choosing a seat.');
    if(choosing)return;choosing=true;
    const next={x:seat.x/1700,y:seat.y/1100,source:'manual'};
    try{await sync({position:next});position=next;await refreshPhone();status('Seat shared. The temperature simulation updates with everyone’s preferences.');}
    catch(e){status(e.message);}finally{choosing=false;}
  }
  window.addEventListener('comfort-seat',event=>selectSeat(event.detail));
  $('seat-select').onchange=()=>{const seat=model.seats.find(s=>s.id===$('seat-select').value);if(seat)selectSeat(seat);};
  sharing(false);
  $('join-form').onsubmit = async event => {
    event.preventDefault(); room = $('room').value.trim(); $('join').disabled = true;
    try { const preference=profile(); session = await api('join', {alias:$('alias').value,profile:preference,consent:$('consent').checked}); session.profile=preference; sharing(true); await refreshPhone(); status('Joined. Choose your seat below.'); $('position-label').textContent='Select a seat to place yourself in the classroom.'; }
    catch(e) { sharing(false); status(e.message); }
  };
  $('save').onclick = async () => { try { await sync({profile:profile()}); await refreshPhone(); status('Preferences saved. Temperature simulation updated.'); } catch(e) { status(e.message); } };
  $('export').onclick = () => { try { download({schema:'common-climate-preferences/v1',units:'celsius',thermalComfort:profile()},'comfort-preferences.json'); status('Preference file prepared.'); } catch(e) { status(e.message); } };
  $('leave').onclick = async () => { try { await api('leave',{}); session=null; position=null; sharing(false); drawSelf(); status('Sharing stopped. Your record was removed.'); } catch(e) { status(e.message); } };
  setInterval(() => { if(session) refreshPhone().catch(e=>status(e.message)); },2000);
  setInterval(() => { if(session) sync().catch(e => { $('connection').textContent='Connection lost'; status(e.message); }); },5000);
}
