'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createProbe, EXPIRES_MS } = require('../prototype/server.cjs');

test('two participants stay distinct, updates synchronize, consent and expiry are enforced', async t => {
  let time = 100000;
  const probe = createProbe({room:'123456', now:()=>time});
  await new Promise(resolve=>probe.server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>probe.server.close(resolve)));
  const root = `http://127.0.0.1:${probe.server.address().port}`;
  const request = async (route, body, token, room='123456') => {
    const response = await fetch(root+'/api/'+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-Room-Code':room,...(token?{'X-Participant-Token':token}:{})},...(body?{body:JSON.stringify(body)}:{})});
    return {status:response.status,data:await response.json()};
  };
  const payload = alias=>({alias,consent:true,profile:{minimum:23,preferred:24.5,maximum:26}});
  assert.equal((await request('state',null,null,'wrong')).status,403);
  assert.equal((await request('join',{...payload('A'),consent:false})).status,400);
  const a = (await request('join',payload('A'))).data;
  const b = (await request('join',payload('B'))).data;
  assert.notEqual(a.id,b.id);
  assert.equal((await request('update',{position:{x:.2,y:.3,source:'manual'}},a.token)).status,200);
  assert.equal((await request('update',{position:{x:.8,y:.7,source:'manual'},profile:{minimum:24,preferred:25,maximum:27}},b.token)).status,200);
  const state = (await request('state')).data;
  assert.equal(state.participants.length,2);
  assert.equal(state.participants.find(p=>p.id===a.id).position.x,.2);
  assert.equal(state.participants.find(p=>p.id===b.id).profile.preferred,25);
  assert.ok(state.participants.every(p=>!('token' in p)));
  assert.equal((await request('update',{position:{x:2,y:0,source:'manual'}},a.token)).status,400);
  assert.equal((await request('update',{position:{x:.3,y:.3,source:'gps'}},a.token)).status,400);
  assert.equal((await request('update',{profile:{minimum:27,preferred:24,maximum:28}},a.token)).status,400);
  assert.equal((await request('update',{},'wrong-token')).status,401);
  assert.equal((await request('leave',{},a.token)).status,200);
  assert.equal((await request('state')).data.participants.length,1);
  time += EXPIRES_MS;
  assert.equal((await request('state')).data.participants.length,0);
  assert.equal((await request('update',{},b.token)).status,401);
  assert.equal((await fetch(root+'/Challenge%20Statements.docx')).status,404);
});
