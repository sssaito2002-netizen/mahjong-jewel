'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine'),S=E.Sanma,C=S.Custom;
test('point sanma validates names, uma and payment ranges and preserves ordinary presets',()=>{
 const base=S.options(),c=C.defaults(),o=S.options({customSanma:c});
 assert.equal(base.flowerCopies,1);assert.equal(o.flowerCopies,0);assert.equal(o.customRuleName,c.name);assert.deepEqual(o.pocchiTypes,[]);
 for(const change of [c=>c.length='west',c=>c.name='',c=>c.startPoints=35001,c=>c.uma=[20,0,0],c=>c.honbaEach=-100,c=>c.notenPool=3500]){
  const p=C.defaults();change(p);assert.throws(()=>C.validate(p));
 }
 const wall=S.makeWall(o);assert.equal(wall.length,108);assert.equal(wall.filter(t=>t==='p0').length,1);assert.equal(wall.filter(t=>t==='s0').length,1);assert(!wall.some(t=>t[0]==='f'||/^z[0A-C]$/.test(t)));
 assert.deepEqual(S.options(o),o);
});
test('point sanma scores ordinary fu, tsumo loss, folded split and honba exactly',()=>{
 const c=C.defaults(),rule=S.rule({},c),h=E.M.Shoupai.fromString('p123456s123z55511'),r=S.score({hand:h,seat:1,rule,customSanma:c});
 assert.equal(r.han,2);assert.equal(r.fu,40);assert.deepEqual([r.pay.child,r.pay.dealer],[700,1300]);assert.deepEqual(r.lines,[]);
 const dealer=S.score({hand:h,seat:0,rule,customSanma:c});assert.equal(dealer.pay.child,1300);
 const ready=h.clone().dapai(h._zimo),ron=S.score({hand:ready,ron:'z1+',seat:1,rule,honba:2,customSanma:c});
 assert.equal(ron.han,1);assert.equal(ron.fu,50);assert.equal(ron.pay.ron,2200);
 const split=S.score({hand:h,seat:1,rule,honba:2,customSanma:{...c,tsumo:'split'}});assert.deepEqual([split.pay.child,split.pay.dealer],[1500,1500]);
});
test('point sanma uses standard local yaku and does not enable five-style chanta or wheel bonuses',()=>{
 const c=C.defaults(),rule=S.rule({},c),hand=E.M.Shoupai.fromString('p112233s778899z11');
 const r=S.score({hand,seat:1,rule,customSanma:c});assert(r);assert(!r.yaku.some(y=>y.name==='大車輪'||y.name==='小車輪'));assert.equal(r.white,false);assert.equal(r.diceEligible,false);
});
test('east/south duration, dealer continuation, agari-yame and bust are explicit',()=>{
 for(const length of ['east','south']){
  const g=new S.Game({customSanma:{...C.defaults(),length,agariYame:false}});
  const last=length==='east'?3:6;g.repeat=false;g.round=last-1;assert.equal(g.shouldFinish([],[]),false);g.round=last;assert.equal(g.shouldFinish([],[]),true);g.repeat=true;assert.equal(g.shouldFinish([g.dealer],[]),false);
  g.options.customSanma.agariYame=true;g.points[g.dealer]=50000;assert.equal(g.shouldFinish([g.dealer],[]),true);assert.equal(g.shouldFinish([], [0]),true);
 }
});
test('full point sanma matches conserve points, settle with zero sum and record the exact custom profile',()=>{
 for(const length of ['east','south']){
  let seed=length==='east'?12:42;const rng=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32),custom={...C.defaults('テスト・'+length),length,startPoints:100000,returnPoints:100000};
  const g=new S.Game({customSanma:custom,rng,cpuLevel:'standard'});let n=0;while(!g.finished&&n++<16000)g.act(S.cpu(g));
  assert(g.finished);assert.equal(g.round,length==='east'?3:6);assert.equal(g.points.reduce((a,b)=>a+b)+g.sticks*1000,300000);assert.deepEqual(g.chips,[0,0,0]);assert(Math.abs(g.results.reduce((n,r)=>n+r.score,0))<1e-9);
  const replay=g.exportReplay();assert.equal(replay.rules.settings.customSanma.length,length);assert.equal(replay.rules.settings.customRuleName,custom.name);assert(g.results.every(r=>r.rankChips===r.score));
 }
});
test('five-style custom south match remains a separate named rule and retains flowers',()=>{
 const o=S.options({customSanma:{...C.defaults('花三麻'),scoring:'goto',length:'south'}});assert.equal(o.flowerCopies,1);assert.equal(E.ResultRules.sanma(o).name,'花三麻');
});
test('legacy full placement vectors can be inferred and explicit correction survives reload without rewriting originals',()=>{
 const D=require('../public/offline/record-data'),rows=(values)=>values.map((n,id)=>({id,rank:id+1,rankChips:n,bonusChips:0})),data={'jewel-offline-results-v1':JSON.stringify({games:[{id:'hard',results:rows([15,5,-5,-15])}],totals:{}}),'houseki-sanma-results-v1':JSON.stringify({games:[{id:'jewel',results:rows([20,0,-20])}],totals:{}})},original=data['jewel-offline-results-v1'],store={getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=v};
 let g=D.load(store);assert.equal(g.games.four[0].ruleMeta.type,'hard');assert.equal(g.games.four[0].ruleSource,'inferred');assert.equal(g.games.sanma[0].ruleMeta.type,'jewel');
 D.assign(store,g.games.four[0].overrideKey,{version:1,game:'four',type:'normal'},'four');g=D.load(store);assert.equal(g.games.four[0].ruleMeta.type,'normal');assert.equal(g.games.four[0].ruleSource,'manual');assert.equal(data['jewel-offline-results-v1'],original);
 assert.equal(E.ResultRules.infer('four',rows([20,5,-5,-20])),null);
});
test('online room retains the custom south profile and only the host may configure it',()=>{
 const {TableRooms}=require('../online/table-rooms'),rooms=new TableRooms({cpuMs:100000,turnMs:100000});let serial=0;
 const command=(r,m,c)=>rooms.command(r,m,{id:'custom-'+serial++,revision:r.revision,...c});
 try{const a=rooms.create('A','sanma'),b=rooms.join(a.room,'B','sanma'),{r,m}=rooms.auth(a.room,a.token),guest=rooms.auth(b.room,b.token).m,custom={...C.defaults('オンライン点数'),length:'south'};
  assert.throws(()=>command(r,guest,{type:'configure',settings:{customSanma:custom}}),/オーナー/);
  command(r,m,{type:'configure',settings:{customSanma:custom}});assert.equal(r.settings.flowerCopies,0);
  for(const member of r.members)command(r,member,{type:'ready',ready:true});command(r,m,{type:'start'});
  assert.equal(r.game.options.customSanma.length,'south');assert.equal(rooms.view(r,guest).settings.customSanma.name,custom.name);
  assert.equal(rooms.view(r,guest).state.hands[m.id].text,null);
 }finally{rooms.close();}
});
test('points mode does not count a four-of-a-kind as two chiitoitsu pairs',()=>{
 const hand=E.M.Shoupai.fromString('p11112233s5577z1'),g=new S.Game({customSanma:C.defaults()});
 assert(g.shanten(hand)>0);assert(g.shanten(hand.clone().zimo('z1'))>=0);assert.equal(g.score(0,hand.clone().zimo('z1')),null);
});
