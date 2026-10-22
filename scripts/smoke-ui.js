'use strict';
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'../public');const server=http.createServer((req,res)=>{const p=path.join(root,req.url.split('?')[0]);fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':p.endsWith('.svg')?'image/svg+xml':'text/html');res.end(b);});});await new Promise(r=>server.listen(8765,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/'))external.push(r.url());});
  await page.goto('http://127.0.0.1:8765/offline/index.html');await page.waitForSelector('#hand button:enabled');await page.waitForFunction(()=>[...document.querySelectorAll('#hand .tile-image')].every(img=>img.complete&&img.naturalWidth>0));
  assert.equal(await page.locator('#hand .tile-image').count(),14);
  await page.evaluate(()=>document.body.style.paddingTop='48px');
  assert.ok((await page.locator('#settings').boundingBox()).y>=48);
  await page.locator('#settings').click();
  await page.locator('input[value=pearl]').check();assert.equal(await page.locator('input[value=turquoise]').isDisabled(),true);
  await page.locator('input[value=gold-pocchi]').check();await page.locator('input[value=gane-pocchi]').check();assert.equal(await page.locator('input[value=topaz]').isDisabled(),true);
  await page.screenshot({path:'mahjong-jewel-settings.png',fullPage:true});await page.locator('#apply-start').click();await page.evaluate(()=>{game.speed=0;});await page.waitForSelector('#hand button:enabled');assert.equal(await page.evaluate(()=>tile('p0').querySelector('.jewel-tag').textContent),'アメ');assert.equal(await page.evaluate(()=>tile('pA').querySelector('.jewel-tag').textContent),'パル');
  for(let i=0;i<20;i++){
   if(await page.evaluate(()=>finished)){await page.locator('#new').click();await page.evaluate(()=>{game.speed=0;});}
   await page.waitForFunction(()=>document.querySelector('#hand button:enabled')||document.querySelector('#actions button')||document.querySelector('#win-confirm[open]')||finished);
   if(await page.locator('#win-confirm').evaluate(el=>el.open)){await page.locator('#win-next').click();continue;}
   let b=page.locator('#hand button:enabled').first();if(!await b.count())b=page.locator('#actions button').filter({hasText:'見送り'}).first();if(!await b.count())b=page.locator('#actions button').first();if(await b.count())await b.click();
  }
  await page.waitForFunction(()=>document.querySelector('#hand button:enabled')||document.querySelector('#actions button')||document.querySelector('#win-confirm[open]')||finished);
  assert.equal(await page.locator('.seat').count(),4);assert.ok(await page.locator('.river .tile').count()>0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'mahjong-jewel-ui.png',fullPage:true});await page.setViewportSize({width:1200,height:1000});await page.screenshot({path:'mahjong-jewel-desktop.png',fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('Mobile/desktop table, direct tile discards, 20 decisions, CPU turns, selection caps and no external requests: OK');
  if(await page.locator('#win-confirm').evaluate(el=>el.open))await page.locator('#win-next').click();
  // Replay the same 20-all settlement exercised through Game.hule in chip-ledger.test.js.
  await page.evaluate(()=>{game.stop();for(const p of game._players){p.onUpdate=()=>{};p.decide=()=>{};}pending=null;finished=false;localStorage.removeItem('jewel-offline-results-v1');totals();update({hule:{l:human._menfeng,baojia:null,defen:12000,hupai:[],jewelChips:20,jewelTotal:60,chipBalances:[60,-20,-20,-20],tobi:[]}},human);});
  assert.deepEqual(await page.locator('#live-chip-rows b').allTextContents(),['+60枚','−20枚','−20枚','−20枚']);
  assert.ok((await page.locator('#log').textContent()).includes('各家から20枚'));
  assert.ok((await page.locator('#totals').textContent()).includes('0戦'));
  assert.ok((await page.locator('#live-chip-state').textContent()).includes('進行中'));
  await page.evaluate(()=>{showWin({l:human._menfeng,baojia:null,shoupai:'m123p0A5s789z11555',defen:12000,fu:30,fanshu:6,hupai:[{name:'立直',fanshu:1}],jewelChips:20,jewelTotal:60,chipBalances:[60,-20,-20,-20],chipDelta:[60,-20,-20,-20],fenpei:[12000,-3000,-6000,-3000]},()=>{$('status').textContent='確認画面の続行を確認';},human);});
  assert.equal(await page.locator('#win-confirm').evaluate(el=>el.open),true);
  assert.ok((await page.locator('#win-receipt').textContent()).includes('各家から20枚'));
  assert.equal(await page.locator('#win-payments tr').count(),4);
  assert.notEqual(await page.locator('#status').textContent(),'確認画面の続行を確認');
  await page.waitForTimeout(200);assert.equal(await page.locator('#win-confirm').evaluate(el=>el.open),true);
  await page.locator('#win-next').click();assert.equal(await page.locator('#status').textContent(),'確認画面の続行を確認');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'mahjong-jewel-win.png',fullPage:true});
  console.log('Win dialog holds continuation until confirmation and shows hand, points and chip payments: OK');
  console.log('Live 20-all receipt shows +60/-20/-20/-20 while finished-game totals stay separate: OK');
  await page.evaluate(()=>JewelOffline.saveResult(localStorage,'browser-persistence',JewelOffline.settle({defen:[40000,25000,20000,15000],rank:[1,2,3,4],bonusChips:[3,-1,-1,-1]})));await page.reload();await page.waitForFunction(()=>document.querySelector('#totals').textContent.includes('合計 53枚'));assert.deepEqual(errors,[]);console.log('Rank/bonus storage survives reload: OK');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
