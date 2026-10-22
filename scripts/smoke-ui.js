'use strict';
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'../public');const server=http.createServer((req,res)=>{const p=path.join(root,req.url.split('?')[0]);fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(b);});});await new Promise(r=>server.listen(8765,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/'))external.push(r.url());});
  await page.goto('http://127.0.0.1:8765/offline/index.html');await page.waitForSelector('#hand button:enabled');await page.locator('#settings').click();
  await page.locator('input[value=pearl]').check();assert.equal(await page.locator('input[value=turquoise]').isDisabled(),true);
  await page.locator('input[value=gold-pocchi]').check();await page.locator('input[value=gane-pocchi]').check();assert.equal(await page.locator('input[value=topaz]').isDisabled(),true);
  await page.screenshot({path:'mahjong-jewel-settings.png',fullPage:true});await page.locator('#apply-start').click();await page.evaluate(()=>{game.speed=0;});await page.waitForSelector('#hand button:enabled');
  for(let i=0;i<20;i++){
   if(await page.evaluate(()=>finished)){await page.locator('#new').click();await page.evaluate(()=>{game.speed=0;});}
   await page.waitForFunction(()=>document.querySelector('#hand button:enabled')||document.querySelector('#actions button')||finished);
   let b=page.locator('#hand button:enabled').first();if(!await b.count())b=page.locator('#actions button').filter({hasText:'見送り'}).first();if(!await b.count())b=page.locator('#actions button').first();if(await b.count())await b.click();
  }
  await page.waitForFunction(()=>document.querySelector('#hand button:enabled')||document.querySelector('#actions button')||finished);
  assert.equal(await page.locator('.seat').count(),4);assert.ok(await page.locator('.river .tile').count()>0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'mahjong-jewel-ui.png',fullPage:true});await page.setViewportSize({width:1200,height:1000});await page.screenshot({path:'mahjong-jewel-desktop.png',fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('Mobile/desktop table, direct tile discards, 20 decisions, CPU turns, selection caps and no external requests: OK');
  await page.evaluate(()=>JewelOffline.saveResult(localStorage,'browser-persistence',JewelOffline.settle({defen:[40000,25000,20000,15000],rank:[1,2,3,4],bonusChips:[3,-1,-1,-1]})));await page.reload();await page.waitForFunction(()=>document.querySelector('#totals').textContent.includes('合計 53枚'));assert.deepEqual(errors,[]);console.log('Rank/bonus storage survives reload: OK');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
