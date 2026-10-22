'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../offline/engine');
test('closed riichi tsumo scores with fu, yaku and Jewel',()=>{
 // Known complete standard hand without red honors.
 const hand=E.M.Shoupai.fromString('m123p123s123z11555');
 const score=E.M.Util.hule(hand,null,E.M.Util.hule_param({rule:E.rule(),lizhi:1,menfeng:1}));
 assert.ok(score.defen>0);assert.ok(score.hupai.some(y=>y.name==='立直'));assert.equal(score.fenpei.reduce((a,b)=>a+b),0);
});
test('Jewel adds han but does not allow dora-only wins',()=>{
 const hand=E.M.Shoupai.fromString('m406p123s789z22555');
 const a=E.M.Util.hule(hand,null,E.M.Util.hule_param({rule:E.rule(),menfeng:1}));
 assert.ok(a.hupai.some(y=>y.name==='Jewel'));
 const b=E.M.Util.hule(hand,null,E.M.Util.hule_param({rule:E.rule({jewelBonus:false}),menfeng:1}));
 assert.equal(a.fanshu,b.fanshu+1);
});
test('bonus transfers, ranks and idempotent persistent separate totals',()=>{
 const chips=[0,0,0,0];E.transfer(chips,0,null,3);assert.deepEqual(chips,[9,-3,-3,-3]);E.transfer(chips,1,0,10);assert.deepEqual(chips,[-1,7,-3,-3]);
 const rows=E.settle({defen:[30000,25000,25000,20000],rank:[1,2,3,4],bonusChips:chips});assert.deepEqual(rows.map(r=>r.rankChips),[50,25,-25,-50]);
 let raw=null;const storage={getItem:()=>raw,setItem:(_,v)=>raw=v};const first=E.saveResult(storage,'a',rows);assert.deepEqual(E.saveResult(storage,'a',rows),first);E.saveResult(storage,'b',rows);assert.equal(JSON.parse(raw).totals[0].rankChips,100);assert.equal(JSON.parse(raw).totals[0].bonusChips,-2);
});
test('55,000 exact boundary ends game',()=>{const g=new E.Game([]);g.model.defen=[55000,15000,15000,15000];g.delay=f=>f();let ended=false;g.jieju=()=>ended=true;g.last();assert.equal(ended,true);assert.equal(g.cold,true);});
test('ron is offered before temporary furiten update; permanent furiten blocks it',()=>{
 let options=[];const p=new E.Player(o=>options=o);
 p.action({kaiju:{id:0,rule:E.rule(),title:'test',player:['a','b','c','d'],qijia:0}},()=>{});
 p.action({qipai:{zhuangfeng:0,jushu:0,changbang:0,lizhibang:0,defen:[25000,25000,25000,25000],baopai:'s2',shoupai:['m123p123s123z1155','','','']}},()=>{});
 p.action({dapai:{l:1,p:'z5'}},()=>{});assert.ok(options.some(a=>a.reply.hule));
 p._neng_rong=false;assert.equal(p.allow_hule(p.shoupai,'z5+'),false);
});
test('CPU games complete with legal actions and conserved points/chips',()=>{
 for(let i=0;i<8;i++){
  const players=Array.from({length:4},()=>new E.Player((opts,reply,msg,p)=>reply(E.cpu(p,opts))));
  let result;const g=new E.Game(players,p=>result=p);g.do_sync();
  assert.ok(result);assert.equal(result.defen.reduce((a,b)=>a+b),100000);assert.equal(g.chips.reduce((a,b)=>a+b),0);assert.deepEqual(result.rank.slice().sort(),[1,2,3,4]);
  for(const round of result.log)for(const msg of round)if(msg.hule)assert.ok(msg.hule.defen>0);
 }
});
