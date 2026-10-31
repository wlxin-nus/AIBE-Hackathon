'use strict';

(() => {
const fcus=[[420,820],[420,560],[750,820],[750,560],[1040,700],[1035,205],[1375,530],[1370,220]];
const desks=[450,650,850].flatMap(y=>[405,680,1000,1320].map(x=>[x,y])).concat([960,1180,1400].map(x=>[x,195]));
const outline=[[70,1040],[70,305],[830,305],[830,70],[1610,70],[1610,620]];
for(let i=1;i<=24;i++){let t=i/24;outline.push([(1-t)*(1-t)*1610+2*(1-t)*t*1610+t*t*1100,(1-t)*(1-t)*620+2*(1-t)*t*1040+t*t*1040]);}

  const floor = {fcus, desks, outline};
  window.comfortFloor = floor;
  const $ = id => document.getElementById(id);
  const ns = 'http://www.w3.org/2000/svg';
  const unitName = index => 'FCU ' + String(index + 1).padStart(2, '0');
  const unitTemp = value => Number(value.toFixed(1)) + ' °C';
  const baseline = 25;
  let room = new URLSearchParams(location.search).get('room') || '';
  let session = null;
  let people = [];
  let selectedZone = null;

  function element(tag, attrs) {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }
  function text(parent, tag, value, css) {
    const node = document.createElement(tag);
    node.textContent = value;
    if (css) node.className = css;
    parent.append(node);
    return node;
  }
  // Both views use the original drawing bounds. / 两端共用原图的坐标范围。
  function world(position) {
    return [70 + 1540 * position.x, 70 + 970 * position.y];
  }
  function inside(x, y) {
    let hit = false;
    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
      const [a,b] = outline[i], [c,d] = outline[j];
      if ((b > y) !== (d > y) && x < (c - a) * (y - b) / (d - b) + a) hit = !hit;
    }
    return hit;
  }
  function zoneOf(position) {
    if (!position) return -1;
    const [x,y] = world(position);
    if (!inside(x,y)) return -1;
    const distances = fcus.map(([cx,cy]) => (cx-x)**2 + (cy-y)**2);
    return distances.indexOf(Math.min(...distances));
  }
  function advice(index) {
    const members = people.filter(p => zoneOf(p.position) === index);
    if (!members.length) return {members, value:baseline, state:'Empty', detail:'No shared positions in this zone. Hold the baseline.'};
    const low = Math.max(...members.map(p => p.profile.minimum));
    const high = Math.min(...members.map(p => p.profile.maximum));
    if (low > high) return {members, value:baseline, state:'Review', detail:'No shared range (' + unitTemp(low-high) + ' gap). Hold the baseline for operator review.'};
    const preferred = members.reduce((sum,p) => sum+p.profile.preferred, 0) / members.length;
    return {members, value:Math.max(low,Math.min(high,preferred)), state:'Aligned', detail:'Shared range ' + unitTemp(low) + ' – ' + unitTemp(high) + '. Target uses the mean preference within that range.'};
  }
  async function api(path, body) {
    const response = await fetch('/api/' + path, {
      method:body ? 'POST' : 'GET', cache:'no-store',
      headers:{'Content-Type':'application/json','X-Room-Code':room,...(session ? {'X-Participant-Token':session.token} : {})},
      ...(body ? {body:JSON.stringify(body)} : {})
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401 && session) {session=null; setSharing(false);}
      throw new Error(result.error || 'Room request failed.');
    }
    return result;
  }
  const message = value => { $('status').textContent = value; };
  window.drawComfortPresence = () => {
    const layer = $('live-dots');
    if (!layer || !window.projectComfortPoint) return;
    layer.replaceChildren();
    for (const p of people.filter(p => zoneOf(p.position) >= 0)) {
      const [x,y] = world(p.position);
      const [px,py] = window.projectComfortPoint([x,y,4]);
      for (const [radius, opacity] of [[43,.07],[30,.12],[18,.20],[6,1]]) {
        layer.append(element('circle',{cx:px,cy:py,r:radius,fill:p.colour,opacity}));
      }
      const name = element('text',{x:px+12,y:py-11,class:'person-name'});
      name.textContent=p.alias;
      layer.append(name);
    }
  };
  function renderDashboard() {
    $('count').textContent = people.length;
    const units = fcus.map((_,i) => advice(i));
    $('occupied').textContent = units.filter(z => z.members.length).length;
    const selected = selectedZone ?? Math.max(0,units.findIndex(z => z.members.length));
    const cards = $('zones');
    cards.replaceChildren();
    for (const [i,z] of units.entries()) {
      const button = document.createElement('button');
      button.type='button';
      button.className='unit ' + (z.members.length ? 'active ' : '') + (z.state === 'Review' ? 'conflict ' : '') + (i===selected ? 'selected' : '');
      button.setAttribute('aria-pressed',String(i===selected));
      text(button,'span',unitName(i)); text(button,'b',unitTemp(z.value)); text(button,'small',z.state + ' · ' + z.members.length);
      button.onclick=()=>{selectedZone=i;renderDashboard();};
      cards.append(button);
    }
    const detail=$('detail');
    detail.replaceChildren(); text(detail,'strong',unitName(selected) + ' · ' + units[selected].state);
    text(detail,'p',units[selected].detail);
    const list=$('people');
    list.replaceChildren();
    if (!people.length) text(list,'p','Waiting for phone check-ins.','subtle');
    for (const p of people) {
      const row=text(list,'div','','person-row');
      const zone=zoneOf(p.position);
      text(row,'strong',p.alias); text(row,'span',(zone<0?'Place on plan':unitName(zone))+' · '+unitTemp(p.profile.preferred)+' preferred · '+p.profile.minimum+'–'+p.profile.maximum+' °C');
      row.style.setProperty('--person',p.colour);
    }
    window.drawComfortPresence();
  }
  function desktop() {
    $('room').value=room;
    async function poll() {
      if (!room) { $('connection').textContent='Enter room code'; return; }
      const requestedRoom = room;
      try {
        const state=await api('state');
        if (requestedRoom !== room) return;
        people=state.participants; renderDashboard(); $('connection').textContent='● Live'; message('');
      } catch(e) {
        people=[]; renderDashboard(); $('connection').textContent='Offline'; message(e.message);
      }
    }
    function link() { $('phone-link').href='/phone?room='+encodeURIComponent(room); }
    $('connect-form').onsubmit=e=>{e.preventDefault();room=$('room').value.trim();history.replaceState(null,'','/?room='+encodeURIComponent(room));link();poll();};
    link(); renderDashboard(); poll(); setInterval(poll,1000);
  }
  function setSharing(active) {
    $('connection').textContent=active?'● Sharing':'Not sharing';
    $('join').disabled=active; $('save').disabled=!active; $('leave').disabled=!active;
    $('alias').readOnly=active; $('room').readOnly=active;
  }
  function profile() {
    const values={minimum:+$('minimum').value,preferred:+$('preferred').value,maximum:+$('maximum').value};
    if (!Object.values(values).every(Number.isFinite) || values.minimum<18 || values.maximum>30 || values.minimum>values.preferred || values.preferred>values.maximum) throw new Error('Use 18–30 °C with the preferred value inside the range.');
    return values;
  }
  function createPlan() {
    const group=$('floor-plan');
    group.append(element('polygon',{points:outline.map(p=>p.join(',')).join(' '),fill:'#eeefe3',stroke:'#7f9077','stroke-width':7}));
    for (const [x,y] of desks) group.append(element('rect',{x:x-32,y:y-49,width:64,height:98,rx:5,fill:'#d8cbb7'}));
    fcus.forEach(([x,y],i)=>{
      group.append(element('rect',{x:x-46,y:y-44,width:92,height:88,rx:12,fill:'#b7d2bc',stroke:'#789887','stroke-width':3}));
      const label=element('text',{x,y:y+11,'text-anchor':'middle',fill:'#254a40','font-size':33});
      label.textContent=String(i+1).padStart(2,'0');group.append(label);
    });
  }
  function phone() {
    $('room').value=room; createPlan();
    $('join-form').onsubmit=async e=>{
      e.preventDefault();room=$('room').value.trim();
      try {
        session=await api('join',{alias:$('alias').value,profile:profile(),consent:$('consent').checked});
        setSharing(true);message('Joined. Tap your location on the floor.');
      } catch(err){message(err.message);}
    };
    $('save').onclick=async()=>{try{await api('update',{profile:profile()});message('Preferences saved.');}catch(e){message(e.message);}};
    $('export').onclick=()=>{
      try {
        const data={schema:'common-climate-preferences/v1',units:'celsius',thermalComfort:profile()};
        const href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
        const a=document.createElement('a');a.href=href;a.download='comfort-preferences.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),10000);
        message('Preference file prepared.');
      } catch(e){message(e.message);}
    };
    $('plan').addEventListener('pointerdown',async e=>{
      if(!session)return message('Join the room to place yourself.');
      const svg=$('plan'),pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
      const pos=pt.matrixTransform(svg.getScreenCTM().inverse());
      if (!inside(pos.x,pos.y)) return message('Choose a point inside the room outline.');
      const position={x:(pos.x-70)/1540,y:(pos.y-70)/970,source:'manual'};
      try {
        await api('update',{position});
        const marker=$('marker'); marker.setAttribute('cx',pos.x);marker.setAttribute('cy',pos.y);marker.style.display='block';
        $('position-label').textContent=unitName(zoneOf(position))+' · Manual position'; message('Position shared.');
      } catch(err){message(err.message);}
    });
    $('leave').onclick=async()=>{try{await api('leave',{});session=null;setSharing(false);$('marker').style.display='none';$('position-label').textContent='Choose a point';message('You left the room.');}catch(e){message(e.message);}};
    setInterval(()=>{if(session) api('update',{}).catch(e=>message(e.message));},5000);
  }
  document.addEventListener('DOMContentLoaded',()=>document.body.dataset.view==='phone'?phone():desktop());
})();
