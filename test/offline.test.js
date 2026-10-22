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
test('one amethyst white pocchi replaces one white in the 136-tile wall',()=>{
 const wall=new E.M.Shan(E.rule())._pai;assert.equal(wall.length,136);assert.equal(wall.filter(p=>p==='z0').length,1);assert.equal(wall.filter(p=>p==='z5').length,3);
 assert.throws(()=>new E.M.Shoupai(['z0','z5','z5','z5','z5']));
});
test('pocchi draw after riichi substitutes a winning tile; ordinary and ron do not',()=>{
 const h=E.M.Shoupai.fromString('m12p123s123z11555z0*');
 const param=E.M.Util.hule_param({rule:E.rule(),menfeng:1,lizhi:1});
 const rv=E.M.Util.hule(h,null,param);assert.ok(rv.defen>0);assert.equal(rv.pocchiAs,'m3');assert.ok(rv.hupai.some(y=>y.name==='アメジストポッチ'));
 assert.equal(E.M.Game.allow_hule(E.rule(),h,null,0,1,true),true);
 const noRiichi=h.clone();noRiichi._lizhi=false;assert.equal(E.M.Util.hule(noRiichi,null,param),undefined);
 const before=h.clone().dapai('z0');assert.equal(E.M.Util.hule(before,'z0+',param),undefined);
 assert.equal(h._zimo,'z0');assert.equal(h._bingpai.z[0],1);
});
test('white pocchi identity survives clone, discard, pon and kan',()=>{
 const hand=new E.M.Shoupai(['z0','z5']);assert.equal(hand.clone().toString(),'z05');
 const pon=hand.get_peng_mianzi('z5+');assert.ok(pon.includes('z505+'));hand.fulou('z505+');assert.equal(hand._bingpai.z[0],0);assert.equal(hand._bingpai.z[5],0);
 const kan=new E.M.Shoupai(['z0','z5','z5','z5']);kan._zimo='z5';assert.ok(kan.get_gang_mianzi().includes('z5550'));kan.gang('z5550');assert.equal(kan._bingpai.z[0],0);
});
test('full-unlock target stays fixed within an east game and adds five base chips',()=>{
 const g=new E.Game([]);assert.ok(E.UNLOCK_YAKU.includes(g._rule.unlockedYaku));const chosen=g._rule.unlockedYaku;
 const h={shoupai:'m123p123s123z11z555',fanshu:3,hupai:[{name:chosen,fanshu:1}]};assert.equal(E.bonus(h,25000,chosen),5);assert.equal(E.bonus(h,25000,'not selected'),0);
 const amethyst={...h,shoupai:'m123p406s123z11z555'};assert.equal(E.bonus(amethyst,25000,chosen),12);assert.equal(g._rule.unlockedYaku,chosen);
});
test('a Jewel cannot turn a yaku-less open ron into a legal win',()=>{
 const h=E.M.Shoupai.fromString('m123p123s789z2,m406-');
 const rv=E.M.Util.hule(h,'z2+',E.M.Util.hule_param({rule:E.rule(),menfeng:1}));assert.ok(!rv?.hupai);
});
test('gold pocchi is wild in an open yaku tenpai but cannot create a yaku itself',()=>{
 const withYaku=E.M.Shoupai.fromString('m12p456s789z22z8,z555+');
 const withoutYaku=E.M.Shoupai.fromString('m12p456s789z22z8,m555+');
 const param=E.M.Util.hule_param({rule:E.rule({pocchiMode:'gold'}),menfeng:1});
 assert.equal(E.M.Util.hule(withYaku,null,param).pocchiAs,'m3');assert.equal(E.M.Util.hule(withoutYaku,null,param),undefined);
 assert.equal(E.M.Game.allow_hule(E.rule({pocchiMode:'gold'}),withYaku,null,0,1,false),true);assert.equal(E.M.Game.allow_hule(E.rule({pocchiMode:'gold'}),withoutYaku,null,0,1,false),false);
});
test('gold and north preserve base identity through serialization, pon, kan and furiten',()=>{
 for(const [marker,base] of [['8','6'],['9','4']]){
  const hand=new E.M.Shoupai(['z'+marker,'z'+base]);const parsed=E.M.Shoupai.fromString(hand.toString());assert.equal(parsed._bingpai.z[+marker],1);assert.equal(parsed._bingpai.z[+base],2);
  const meld=hand.get_peng_mianzi('z'+base+'+')[0];assert.ok(meld);hand.fulou(meld);assert.equal(hand._bingpai.z[+marker],0);assert.equal(hand._bingpai.z[+base],0);
  const river=new E.M.He().dapai('z'+marker);assert.equal(river.find('z'+base),true);
  const kan=new E.M.Shoupai(['z'+marker,...Array(3).fill('z'+base)]);kan._zimo='z'+base;const k=kan.get_gang_mianzi()[0];assert.ok(k);kan.gang(k);assert.equal(kan._bingpai.z[+base],0);
 }
});
test('north wildcard needs riichi and garnet/crystal uses the higher chip effect',()=>{
 const h=E.M.Shoupai.fromString('m12p123s123z11555z9*'),param=E.M.Util.hule_param({rule:E.rule({pocchiMode:'gane'}),menfeng:1,lizhi:1});assert.equal(E.M.Util.hule(h,null,param).pocchiAs,'m3');
 h._lizhi=false;assert.equal(E.M.Util.hule(h,null,param),undefined);
 assert.equal(E.garnetValue(['m3','z1','s4'],['p1','p8','s2']),8);assert.equal(E.garnetValue(['z1'],['z2']),0);
 const win={shoupai:'m123p456s789z99',winningTile:'m9',indicators:['m3','z1'],garnetUra:['p2','s8'],hupai:[]};assert.equal(E.bonus(win,25000),18); // two north markers: 2 * max(8,9)
 assert.equal(E.bonus({...win,winningTile:'z4'},25000),16);
 const gold={shoupai:'m123p456s789z88',hupai:[]};assert.equal(E.bonus(gold,25000),8);
});
test('each selected pocchi mode uses exactly one physical replacement',()=>{
 for(const mode of ['white','amethyst-white','gold','gane']){
  const rules=E.rule({pocchiMode:mode}),wall=new E.M.Shan(rules)._pai;
  assert.equal(wall.length,136);assert.equal(wall.filter(t=>['z0','z8','z9'].includes(t)).length,1);
  const expected=mode==='gold'?'z8':mode==='gane'?'z9':'z0';assert.ok(wall.includes(expected));
 }
});
test('all four pocchi modes complete seeded CPU east games',()=>{
 const random=Math.random;let seed=91234567;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 try{for(const mode of ['white','amethyst-white','gold','gane',['amethyst-white','gold','gane']])for(let i=0;i<3;i++){
  const players=Array.from({length:4},()=>new E.Player((o,r,m,p)=>r(E.cpu(p,o))));let result;
  new E.Game(players,p=>result=p,Array.isArray(mode)?{pocchiModes:mode}:{pocchiMode:mode}).do_sync();
  assert.equal(result.defen.reduce((a,b)=>a+b),100000);assert.equal(result.bonusChips.reduce((a,b)=>a+b),0);
 }}finally{Math.random=random;}
});
test('zero to three pocchi types can be configured without changing wall size',()=>{
 for(const modes of [[],['gold'],['amethyst-white','gane'],['amethyst-white','gold','gane']]){
  const w=new E.M.Shan(E.rule({pocchiModes:modes}))._pai;assert.equal(w.length,136);assert.equal(w.filter(t=>['z0','z8','z9'].includes(t)).length,modes.length);
 }
 assert.throws(()=>E.rule({pocchiModes:['gold','gold']}));
});
test('full Jewel needs all three suited Jewels and at least two distinct pocchi',()=>{
 const param=E.M.Util.hule_param({rule:E.rule({pocchiModes:['amethyst-white','gold','gane']}),menfeng:1});
 const h=E.M.Shoupai.fromString('m406p406s406z05568');const rv=E.M.Util.hule(h,null,param);assert.ok(rv.damanguan>=1);assert.ok(rv.hupai.some(y=>y.name==='フルジュエル'));
 const missing=E.M.Shoupai.fromString('m456p406s406z05568');assert.ok(!E.M.Util.hule(missing,null,param).hupai.some(y=>y.name==='フルジュエル'));
 const one=E.M.Shoupai.fromString('m406p406s406z05566');assert.ok(!E.M.Util.hule(one,null,param).hupai.some(y=>y.name==='フルジュエル'));
});
