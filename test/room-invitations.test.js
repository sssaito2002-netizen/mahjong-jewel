'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{Rooms}=require('../online/rooms'),{TableRooms}=require('../online/table-rooms'),{createServer}=require('../online/server');
for(const [label,make,kind]of [['four',()=>new Rooms(),'four'],['sanma',()=>new TableRooms(),'sanma'],['chinchiro',()=>new TableRooms(),'chinchiro']]){
 test(label+': invitations grant a fresh participant seat, never owner authority; rotate and expiry enforced',()=>{
  const rooms=make();try{const host=rooms.create('オーナー',kind),{r,m}=rooms.auth(host.room,host.token),invite=rooms.invitation(r,m,{});
   assert.match(invite.token,/^[a-f0-9]{64}$/);assert.notEqual(invite.token,host.token);assert.equal(rooms.invitation(r,m,{}).token,invite.token);
   assert.throws(()=>rooms.auth(host.room,invite.token),/参加情報が無効/);
   assert.throws(()=>rooms.join(host.room,'偽造',kind,'0'.repeat(64)),/招待URL/);assert.equal(r.members.length,1);
   const guest=rooms.join(host.room,'参加者',kind,invite.token);assert.equal(guest.self,1);assert.notEqual(guest.token,host.token);assert.notEqual(guest.token,invite.token);
   assert.throws(()=>rooms.invitation(r,rooms.auth(host.room,guest.token).m,{}),/オーナー/);
   const visible=label==='four'?rooms.events(r,rooms.auth(host.room,guest.token).m,0):rooms.events(r,rooms.auth(host.room,guest.token).m,0);assert(!JSON.stringify(visible).includes(invite.token));assert(!JSON.stringify(visible).includes(host.token));
   const next=rooms.invitation(r,m,{rotate:true});assert.notEqual(next.token,invite.token);assert.throws(()=>rooms.join(host.room,'古い招待',kind,invite.token),/招待URL/);
   r.invitation.expiresAt=Date.now()-1;assert.throws(()=>rooms.join(host.room,'期限切れ',kind,next.token),/招待URL/);
   const renewed=rooms.invitation(r,m,{});assert.notEqual(renewed.token,next.token);r.phase='playing';assert.throws(()=>rooms.invitation(r,m,{}),/開始前/);assert.throws(()=>rooms.join(host.room,'途中参加',kind,renewed.token));
  }finally{rooms.close();}
 });
}
test('HTTP invitation endpoint requires owner auth and cannot be used as a bearer credential',async()=>{
 const {server,tables}=createServer({accessSecureCookie:false});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{
  const login=await fetch(base+'/access?game=chinchiro',{method:'POST',body:'password=pass1234',redirect:'manual'}),cookie=login.headers.get('set-cookie').split(';')[0];
  const post=async(path,body,token)=>{const res=await fetch(base+path,{method:'POST',headers:{cookie,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:res.status,data:await res.json()};};
  const host=(await post('/api/tables',{name:'owner',game:'chinchiro'})).data;
  const path='/api/tables/'+host.room;
  assert.equal((await post(path+'/invite',{})).status,400);
  const invite=(await post(path+'/invite',{},host.token)).data;
  assert.equal((await post(path+'/invite',{},invite.token)).status,400);
  assert.equal((await post(path+'/join',{name:'guest',game:'chinchiro',invite:invite.token})).status,200);
  assert.equal(tables.room(host.room).members.length,2);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
