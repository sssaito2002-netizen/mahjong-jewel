'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine'),S=E.Sanma,B=S.Bingo;
const hand=t=>E.M.Shoupai.fromString(t,true),game=()=>new S.Game({customSanma:S.Custom.bingo()});
test('bingo uses only its own 8-seven hand flag, 112-tile wall and 14 reserved tiles',()=>{
 const g=game(),w=S.makeWall(g.options);assert.equal(w.length,112);for(const s of ['p','s']){assert.equal(w.filter(t=>t===s+'7').length,8);assert.equal(w.filter(t=>t===s+'0').length,2);}
 assert(!w.some(t=>t[0]==='m'));assert.equal(g.dead.length,14);assert.equal(g.indicators.length,1);assert.deepEqual(g.points,[30000,30000,30000]);assert.equal(g.options.pocchiTypes.length,0);
 assert.throws(()=>new E.M.Shoupai(Array(5).fill('p7')));const h=new E.M.Shoupai(Array(7).fill('p7'),true);assert.equal(h.clone().zimo('p7')._bingpai.p[7],8);assert.throws(()=>h.clone().zimo('p7').dapai('p7').zimo('p7').zimo('p7',false));
});
test('a fifth seven is not a normal winning wait and does not cause furiten on the real wait',()=>{
 const g=game(),h=hand('p123s56777789z11*');g.hands[0]=h;g.rivers[0]=['s7'];g.phase='react';g.last={from:1,tile:'s4'};
 assert(g.waits(h).includes('s4'));assert(!g.waits(h).includes('s7'));assert.equal(g.canRon(0),true);g.last.tile='s7';assert.equal(g.canRon(0),false);
 assert.equal(g.score(0,hand('p123s567777789z11'),null,{preview:true}),null);
});
test('seven-orphans waits on its 13 actual kinds and all-sevens alone is exempt from four-copy limit',()=>{
 const g=game(),orphan=new E.M.Shoupai(B.ORPHANS,true);assert.equal(g.waits(orphan).length,13);assert(g.score(0,orphan.clone().zimo('p7'),null,{preview:true}).yaku.some(y=>y.name==='七士無双'));
 const ready=hand('p7777777s777777');assert.deepEqual(g.waits(ready),['p7','s7']);const r=g.score(0,ready.clone().zimo('s7'),null,{preview:true});assert.equal(r.damanguan,2);assert.equal(r.yaku[0].name,'オールセブン');
});
test('four-copy seven-pairs can make clear terminals, but a seven never counts as a terminal',()=>{
 const g=game(),r=g.score(0,hand('p11119999s111199'),null,{preview:true});assert(r.yaku.some(y=>y.name==='清老頭'));
 const no=g.score(0,hand('p117799s117799z11'),null,{preview:true});assert(no);assert(!no.yaku.some(y=>y.name==='清老頭'));
});
test('tulip upgrades on six hits, begins lower rows only on the next column, and 16R doubles the receipt',()=>{
 const tiles=['p7','p7','p8','p8','p9','p9'],r=B.tulip({tiles,riichi:true,wall:['p8','z4','p1','p8','z7','z4']});
 assert.equal(r.initialStage,0);assert.deepEqual(r.reveals.map(r=>r.tiles.length),[1,2,2]);assert.deepEqual(r.reveals.map(r=>r.stageAfter),[1,2,2]);assert.equal(r.chips,14);assert.equal(r.multiplier,2);
 const flower=B.tulip({tiles,flowers:['f1','f2'],riichi:true,wall:['f3','p8','z7','p8']});assert.equal(flower.reveals[0].hits,6);assert.equal(flower.finalStage,0);
});
test('ippatsu and sanbaiman provide separate stocks; real yakuman start at the article-specific stage',()=>{
 const stocks=B.tulip({tiles:['p2'],riichi:true,ippatsu:true,han:11,wall:['z1','z1','z1','z1','z1','z1','z1','z1']});assert.equal(stocks.initialStocks,2);assert.equal(stocks.reveals.length,3);
 assert.equal(B.tulip({tiles:['p7','p7','p7'],yakuman:1,wall:[]}).initialStage,0);
 assert.equal(B.tulip({tiles:['p2'],yakuman:1,riichi:true,wall:[]}).initialStage,1);
 assert.equal(B.tulip({tiles:['p7','p7','p7'],yakuman:1,riichi:true,wall:[]}).initialStage,2);
 assert.equal(B.tulip({tiles:['p2'],yakuman:1,tianhu:1,wall:[]}).initialStage,1);
});
test('article rank settlement is zero-sum on both sides of the original-points threshold',()=>{
 assert.deepEqual(B.rank([40000,30000,20000]).delta,[30,10,-40]);assert.deepEqual(B.rank([41000,29000,20000]).delta,[40,-10,-30]);
});
test('seeded full bingo matches keep a physical wall and settle points and chips exactly once',()=>{
 for(const initial of [15,48]){let seed=initial;const rng=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32),g=new S.Game({customSanma:S.Custom.bingo(),rng});let n=0;
  while(!g.finished&&n++<15000){assert.equal(g.dead.length,14);const deck=[...g.wall,...g.dead,...g.hands.flatMap(h=>E.J.rawTiles(h.toString())),...g.flowers.flat(),...g.rivers.flat().filter(t=>!t.endsWith('-')).map(t=>t.slice(0,2))];assert.equal(deck.length,112);assert.equal(deck.filter(t=>t==='p7').length,8);assert.equal(deck.filter(t=>t==='s7').length,8);g.act(S.cpu(g));}
  assert(g.finished);assert.equal(g.points.reduce((a,b)=>a+b)+g.sticks*1000,90000);assert.equal(g.chips.reduce((a,b)=>a+b),0);assert.equal(g.results.reduce((a,b)=>a+b.rankChips,0),0);
  const replay=g.exportReplay();assert.equal(replay.rules.settings.customSanma.scoring,'bingo');assert(replay.events.some(e=>e.type==='hule'));
 }
});
test('16R doubles the complete normal chip receipt, leaves tobi out, and preserves chip ledger conservation',()=>{
 const g=new S.Game({customSanma:{...S.Custom.bingo(),tileChips:[{tile:'p7',chips:2},{tile:'s7',chips:1}]}});g.hands[0]=hand('p123777s123777z11*');g.dealer=0;g.turn=0;g.phase='turn';g.dead[0]='z7';g.dead[1]='z7';g.wall=['z7','z7'];g.draws=[2,2,2];g.ippatsu=[false,false,false];g.flowers=[[],[],[]];
 g.win([0],null);assert.deepEqual(g.chips,[36,-18,-18]);assert.equal(g.summary.wins[0].bingoTulip.multiplier,2);assert.equal(g.summary.wins[0].chipFactor,2);g.chipPay(0,1,2,'トビ賞');assert.deepEqual(g.chips,[36,-18,-18]);
});
test('bingo kan consumes a reserve tile, replenishes reserve from live wall and keeps 14 reserved',()=>{
 const g=game();g.hands[0]=hand('p7777s123456z1112');g.turn=0;g.phase='turn';g.dead[10]='p2';const before=g.wall.length,dead=g.dead.slice(),drawn=dead[10];
 g.commitKan(0,'p7777');assert.equal(g.dead.length,14);assert.equal(g.wall.length,before-1);assert.equal(g.kans,1);assert.equal(g.indicators.length,2);assert.equal(g.hands[0]._zimo,drawn);
});
