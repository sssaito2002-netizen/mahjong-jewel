'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine'),T=E.TileChips,S=E.Sanma;
test('every four-player logical tile can receive chips without altering wall, fu or han',()=>{
 assert.equal(T.BASES.length,34);const c=E.CustomFour.example();c.tileChips=[{tile:'p7',chips:2},{tile:'z1',chips:3}];
 const rule=E.rule({customFour:c});assert.equal(new E.M.Shan(rule)._pai.length,136);
 const h={shoupai:'m123p777s123z11155',fanshu:2,hupai:[],baojia:1},b=E.J.bonusBreakdown(h,25000,null,rule);
 assert.equal(b.perPayer,15);assert.deepEqual(b.lines.map(l=>[l.tile,l.count,l.amount]),[['p7',3,6],['z1',3,9]]);
 assert.equal(h.fanshu,2);
});
test('base bonuses add to physical special fives and use all four tiles in a kan',()=>{
 const c=E.CustomFour.example();c.tileChips=[{tile:'p5',chips:2},{tile:'z5',chips:3}];
 const rule=E.rule({customFour:c}),b=E.J.bonusBreakdown({shoupai:'m123s123z55,p0AB5+',fanshu:4,hupai:[],baojia:1},25000,null,rule);
 assert.equal(b.perPayer,26);assert.equal(b.lines.find(l=>l.tile==='p5').count,4);assert.equal(b.lines.find(l=>l.tile==='z5').amount,6);
});
test('sanma point-mode chip bonuses use concealed tiles and extracted North without changing points',()=>{
 const hand=E.M.Shoupai.fromString('p123456s123z55511'),plain=S.Custom.defaults(),bonus={...plain,tileChips:[{tile:'z5',chips:3},{tile:'z4',chips:2}]},rule=S.rule({},bonus);
 const a=S.score({hand,seat:1,rule,customSanma:plain,north:2}),b=S.score({hand,seat:1,rule,customSanma:bonus,north:2});
 assert.deepEqual(b.pay,a.pay);assert.equal(b.lines.reduce((n,l)=>n+l.amount,0),13);assert.equal(b.han,a.han);
});
test('configured point-mode chips are conserved and unrelated legacy bonuses stay disabled',()=>{
 const c={...S.Custom.defaults(),tileChips:[{tile:'p1',chips:2}]},g=new S.Game({customSanma:c});
 g.chipPay(0,1,6,'和了祝儀');assert.deepEqual(g.chips,[6,-6,0]);g.chipPay(0,1,2,'トビ賞');assert.deepEqual(g.chips,[6,-6,0]);g.chipPay(0,null,2,'和了祝儀');assert.deepEqual(g.chips,[10,-8,-2]);
});
test('chip rules survive normalized saved profiles and reject duplicates, absent tiles and invalid amounts',()=>{
 const c=S.Custom.validate({...S.Custom.defaults(),tileChips:[{tile:'s9',chips:5}]});assert.deepEqual(S.options({customSanma:c}).customSanma.tileChips,[{tile:'s9',chips:5}]);
 for(const bad of [[{tile:'m2',chips:1}],[{tile:'s9',chips:-1}],[{tile:'s9',chips:.5}],[{tile:'s9',chips:1},{tile:'s9',chips:2}]])assert.throws(()=>T.validate(bad,{sanma:true}));
 assert.deepEqual(T.validate([{tile:'s9',chips:0}]),[]);
});
test('a wildcard keeps the physical white bonus instead of a bonus for the substituted tile',()=>{
 const c={...S.Custom.defaults('ポッチ祝儀'),scoring:'goto',tileChips:[{tile:'z5',chips:3},{tile:'z1',chips:10}]},o=S.options({customSanma:c}),hand=E.M.Shoupai.fromString('p123456789s123z1z0*');
 const r=S.score({hand,seat:1,rule:S.rule(o.house,c),house:o.house,customSanma:c,flowerRules:{spring:'off',summer:'off',autumn:'off',winter:'off'}});
 assert(r?.white);assert.equal(r.pocchiAs,'z1');assert.equal(r.lines.filter(l=>l.tile).reduce((n,l)=>n+l.amount,0),13);
 assert.equal(r.lines.find(l=>l.tile==='z5').count,1);assert.equal(r.lines.find(l=>l.tile==='z1').count,1);
});
test('real point-sanma win settles each configured tile bonus once for ron and for both tsumo payers',()=>{
 for(const ron of [false,true]){
  const c={...S.Custom.defaults('祝儀精算'),tileChips:[{tile:'z5',chips:3},{tile:'z4',chips:2}]},g=new S.Game({customSanma:c}),hand=E.M.Shoupai.fromString('p123456s123z55511');
  g.dealer=0;g.turn=0;g.draws=[2,2,2];g.ippatsu=[false,false,false];g.north[0]=2;g.hands[0]=ron?hand.clone().dapai(hand._zimo):hand;g.phase=ron?'react':'turn';if(ron)g.last={tile:hand._zimo,from:1};
  g.win([0],ron?1:null);assert.deepEqual(g.chips,ron?[13,-13,0]:[26,-13,-13]);assert.equal(g.chips.reduce((a,b)=>a+b),0);assert.equal(g.summary.wins[0].chipTransfers.reduce((n,t)=>n+t.amount,0),ron?13:26);
 }
});
