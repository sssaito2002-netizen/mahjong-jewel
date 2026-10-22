'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{createServer}=require('../online/server');
(async()=>{
 const {server,rooms}=createServer({accessSecureCookie:false,turnMs:60000,callMs:60000,confirmMs:60000});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});try{
  const contexts=await Promise.all([browser.newContext({viewport:{width:390,height:844}}),browser.newContext({viewport:{width:390,height:844}})]),pages=await Promise.all(contexts.map(c=>c.newPage())),errors=[];
  for(const p of pages)p.on('pageerror',e=>errors.push(e.message));
  await Promise.all(pages.map(p=>p.goto(url)));for(const p of pages){await p.locator('#preview-password').fill('pass1234');await p.locator('button[type=submit]').click();await p.waitForSelector('#online-name');}const [a,b]=pages;
  await a.locator('#online-name').fill('Alice');await a.locator('#create-room').click();await a.waitForSelector('#room-info:not([hidden])');
  const code=await a.evaluate(()=>onlineSession.room);await b.locator('#online-name').fill('Bob');await b.locator('#room-code').fill(code);await b.locator('#join-room').click();await b.waitForSelector('#room-info:not([hidden])');
  await a.waitForFunction(()=>onlineLobby.members.length===2);await a.locator('#open-table-menu').click();await a.locator('#settings').click();await a.locator('input[value=pearl]').check();await a.locator('#apply-start').click();await a.locator('#close-table-menu').click();await b.waitForFunction(()=>onlineLobby.selection.includes('pearl'));
  await a.locator('#ready-room').click();await b.locator('#ready-room').click();await a.waitForSelector('#start-room:enabled');await a.locator('#start-room').click();
  await Promise.all(pages.map(p=>p.waitForSelector('#game-area:not([hidden])')));
  for(let i=0;i<45;i++){
   let acted=false;for(const p of pages){const result=await p.evaluate(()=>{if(finished)return 'done';if($('win-confirm').open){$('win-next').click();return true;}if($('riichi-confirm').open){$('riichi-next').click();return true;}if(pending){consume(E.cpu(human,pending.options));return true;}return false;});acted=acted||result===true;}
   await new Promise(r=>setTimeout(r,acted?40:100));
  }
  assert.ok(await a.locator('.river .tile').count()>0);assert.equal(await a.locator('.seat').count(),4);assert.equal(await b.locator('.seat').count(),4);
  await a.screenshot({path:'houseki-online-a.png',fullPage:true});await b.screenshot({path:'houseki-online-b.png',fullPage:true});
  const token=await a.evaluate(()=>onlineSession.token);await a.reload();await a.waitForFunction(()=>human?.model?.shan);assert.equal(await a.evaluate(()=>onlineSession.token),token);
  const current=rooms.room(code);assert.equal(current.members.length,2);assert.equal(current.game._players.length,4);
  await a.waitForFunction(()=>onlineCursor>0);assert.deepEqual(errors,[]);
  const firstMatch=current.matchId;current.game.stop();for(const member of current.members){if(member.pending){clearTimeout(member.pending.timer);rooms.emit(member,'resolved',{id:member.pending.id});member.pending=null;}}
  current.game._callback({defen:[40000,25000,20000,15000],rank:[1,2,3,4],bonusChips:[60,-20,-20,-20]});
  await Promise.all(pages.map(p=>p.waitForSelector('#match-complete[open]')));assert.equal(await a.locator('.complete-ledger tbody tr').count(),4);await a.screenshot({path:'houseki-online-complete.png',fullPage:true});
  await a.locator('.complete-buttons button').first().click();await a.waitForSelector('#online-lobby:not([hidden])');assert.equal(current.members[1].ready,false);
  await b.locator('.complete-buttons button').first().click();await a.waitForSelector('#start-room:enabled');await a.locator('#start-room').click();
  await a.waitForSelector('#game-area:not([hidden])');assert.notEqual(current.matchId,firstMatch);assert.equal(current.phase,'playing');assert.deepEqual(errors,[]);
  console.log('Both players see terminal results and can ready the same room for a second match: OK');
  const bad=await fetch(url+'/api/rooms/'+code+'/events',{headers:{Authorization:'Bearer bad'}});assert.equal(bad.status,400);
  const cross=await fetch(url+'/api/rooms',{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:'{"name":"Mallory"}'});assert.equal(cross.status,403);
  console.log('Two isolated mobile browsers, room creation/join, gem sync, 2 humans + 2 CPUs, tile actions, reconnection, auth and same-origin checks: OK');
 }finally{await browser.close();rooms.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1);});
