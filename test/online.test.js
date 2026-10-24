'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{Rooms}=require('../online/rooms'),E=require('../offline/engine');
const tick=()=>new Promise(r=>setTimeout(r,1));
function prepare(opts={}){const rooms=new Rooms(opts),a=rooms.create('Alice'),b=rooms.join(a.room,'Bob'),{r,m}=rooms.auth(a.room,a.token),other=rooms.auth(a.room,b.token).m;return {rooms,r,m,other,a,b};}
test('room auth, host-only configuration, ready reset, capacity and hidden tokens',()=>{
 const {rooms,r,m,other,a}=prepare();try{assert.throws(()=>rooms.auth(a.room,'wrong'));assert.throws(()=>rooms.command(r,other,{type:'configure',selection:[]}));rooms.command(r,m,{type:'ready',ready:true});rooms.command(r,other,{type:'ready',ready:true});rooms.command(r,m,{type:'configure',selection:['pearl']});assert.ok(r.members.every(m=>!m.ready));assert.throws(()=>rooms.command(r,m,{type:'start'}));rooms.join(a.room,'C');rooms.join(a.room,'D');assert.throws(()=>rooms.join(a.room,'E'));assert.ok(!JSON.stringify(m.events).includes(other.token));assert.ok(!JSON.stringify(other.events).includes(m.token));}finally{rooms.close();}
});
test('server-authoritative 2-human + 2-CPU east game finishes with matching results, private hands and replay',async()=>{
 const {rooms,r,m,other,a}=prepare({turnMs:60000,callMs:60000,confirmMs:60000});
 try{
  rooms.command(r,m,{type:'ready',ready:true});rooms.command(r,other,{type:'ready',ready:true});rooms.command(r,m,{type:'start'});assert.equal(r.game._players.length,4);
  let first=true;
  const deadline=Date.now()+20000;
  while(r.phase!=='finished'&&Date.now()<deadline){for(const member of r.members){const p=member.pending;if(!p)continue;
    if(first&&p.type==='action'){first=false;assert.throws(()=>rooms.command(r,member,{type:'reply',id:p.id,reply:{dapai:'z9*'}}));assert.equal(member.pending.id,p.id);}
    const reply=p.type==='action'?E.cpu(r.game._players[member.id],p.data.options):{};
    rooms.command(r,member,{type:'reply',id:p.id,reply});rooms.command(r,member,{type:'reply',id:p.id,reply});
   }await tick();}
  assert.equal(r.phase,'finished');assert.equal(r.results.reduce((n,x)=>n+x.points,0),100000);assert.equal(r.results.reduce((n,x)=>n+x.bonusChips,0),0);
  assert.deepEqual(m.events.find(e=>e.type==='result').data,other.events.find(e=>e.type==='result').data);
  for(const member of r.members){const q=member.events.find(e=>e.type==='game'&&e.data.qipai).data.qipai;assert.equal(q.shoupai.filter(Boolean).length,1);assert.equal(rooms.auth(a.room,member.token).m,member);assert.deepEqual(rooms.events(r,member,0).events,member.events.slice(0,200));}
 }finally{rooms.close();}
});
test('disconnected human choices time out and CPU seats keep the game moving',async()=>{
 const {rooms,r,m,other}=prepare({turnMs:2,callMs:2,confirmMs:2});try{m.ready=other.ready=true;rooms.command(r,m,{type:'start'});const deadline=Date.now()+20000;while(r.phase!=='finished'&&Date.now()<deadline)await tick();assert.equal(r.phase,'finished');assert.ok(m.events.some(e=>e.type==='resolved'));assert.equal(r.results.reduce((s,x)=>s+x.bonusChips,0),0);}finally{rooms.close();}
});
test('next match keeps the room, resets readiness once and rejects stale or mid-game requests',()=>{
 const {rooms,r,m,other}=prepare();try{
  assert.throws(()=>rooms.command(r,m,{type:'next',matchId:'unknown'}));
  r.phase='finished';r.matchId='finished-match';m.ready=other.ready=true;
  rooms.command(r,m,{type:'next',matchId:r.matchId});assert.equal(r.phase,'lobby');assert.equal(m.ready,true);assert.equal(other.ready,false);
  assert.throws(()=>rooms.command(r,m,{type:'start'}));rooms.command(r,other,{type:'next',matchId:r.matchId});rooms.command(r,m,{type:'next',matchId:r.matchId});assert.ok(r.members.every(m=>m.ready));
  rooms.command(r,m,{type:'start'});assert.equal(r.phase,'playing');assert.notEqual(r.matchId,'finished-match');assert.throws(()=>rooms.command(r,m,{type:'next',matchId:'finished-match'}));
 }finally{rooms.close();}
});
