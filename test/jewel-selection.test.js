'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine'),{M,J}=E;
function score(text,ids,extra={},ron=null){const rule=E.rule({gemSelection:ids});return M.Util.hule(M.Shoupai.fromString(text),ron,M.Util.hule_param({rule,menfeng:1,...extra}));}
test('selection rejects duplicate IDs and a third Jewel of the same logical tile',()=>{assert.throws(()=>J.configure(['pearl','pearl']));assert.throws(()=>J.configure(['pearl','amethyst-p','turquoise']));assert.throws(()=>J.configure(['topaz','amethyst-white','gold-pocchi','gane-pocchi']));assert.throws(()=>J.configure(['unknown']));});
test('every supported selection replaces actual tiles, keeps 136 tiles and four per base',()=>{for(const g of J.CATALOG){const rule=E.rule({gemSelection:[g.id]}),wall=new M.Shan(rule)._pai,counts={};assert.equal(wall.length,136);for(const p of wall){const n=M.Shoupai.normal_pai(p);counts[n]=(counts[n]||0)+1;}assert.equal(Object.keys(counts).length,34);assert.ok(Object.values(counts).every(n=>n===4));assert.equal(wall.filter(p=>rule.gemTiles[p]).length,1);}});
test('amethyst and pearl 5p remain distinct through clone, draw, discard, chi, pon and kan',()=>{
 const h=new M.Shoupai(['p0','pA','p5','p5']);h._zimo='p5';assert.equal(h.clone().toString(),'p0A5p5');
 const k=h.get_gang_mianzi()[0];assert.ok(k.includes('0')&&k.includes('A'));h.gang(k);assert.equal(h._bingpai.p[5],0);assert.equal(h._bingpai.p[10],0);
 const pon=new M.Shoupai(['pA','p0']);assert.ok(pon.get_peng_mianzi('p5+').some(m=>m.includes('A')&&m.includes('0')));
 const chi=new M.Shoupai(['p4','pA']);const c=chi.get_chi_mianzi('p6-')[0];assert.ok(c);chi.fulou(c);assert.equal(chi._bingpai.p[10],0);
 const d=M.Shoupai.fromString('m123p0A5s123z11555');d.dapai('pA');assert.equal(d._bingpai.p[10],0);assert.equal(d._bingpai.p[0],1);
});
test('pearl multiplies han and carnelian supports both modes with low-han fallback',()=>{
 const pearl=score('m123p406s789z22555',['pearl'],{lizhi:1});const ordinary=score('m123p406s789z22555',[],{lizhi:1});assert.equal(pearl.fanshu,ordinary.fanshu*2);
 const chips=score('m123p406s789z22555',['carnelian'],{jewelChoice:'chips'});const han=score('m123p406s789z22555',['carnelian'],{jewelChoice:'han'});assert.equal(han.fanshu,chips.fanshu+6);assert.equal(chips.carnelianChoice,'chips');assert.equal(han.carnelianChoice,'han');assert.deepEqual(J.modifyHan([J.BY_ID.carnelian],1,'chips'),{han:6,carnelianChoice:'han'});
});
test('turquoise restores open pinfu and permits riichi without inventing concealed triplets',()=>{
 const hand=M.Shoupai.fromString('m123p40s789z44,p123-'),r=E.rule({gemSelection:['turquoise']});
 const result=M.Util.hule(hand,'p6+',M.Util.hule_param({rule:r,menfeng:1}));assert.ok(result.hupai.some(y=>y.name==='平和'));assert.equal(result.fu,30);
 hand.zimo('p6');assert.ok(M.Game.allow_lizhi(r,hand,null,50,25000));
 assert.equal(M.Game.allow_lizhi(E.rule({gemSelection:[]}),hand,null,50,25000),false);
});
test('black diamond counts tanyao, concealed terminal/honor triplets and kans',()=>{
 assert.equal(score('m23466p406s444678',['black-diamond']).blackChips,5);
 assert.equal(score('m234p406s678z11,z5555',['black-diamond']).blackChips,12);
 const ron=score('m234p406s678z1155',['black-diamond'],{},'z5+');assert.equal(ron.blackChips,5);
});
test('three different physical Jewels give one Jewel yaku, including an otherwise yaku-less ron',()=>{
 const ids=['lapis','amethyst-p','tourmaline'];const rv=score('m406p406s406z1155',ids,{},'z5+');assert.ok(rv.hupai.some(y=>y.name==='Jewel'&&y.fanshu===1));
});
test('each effect gives specified chips and amethyst multiplies after additions',()=>{
 const rule=E.rule({gemSelection:['amethyst-p','pearl']}),h={shoupai:'m123p0A5s123z11555',fanshu:8,hupai:[],baojia:1};assert.equal(E.bonus(h,25000,null,rule),8);
 const goldRule=E.rule({gemSelection:['gold','gold-pocchi']}),g={shoupai:'m123p406s123z11668',fanshu:3,hupai:[],baojia:1};assert.equal(E.bonus(g,25000,null,goldRule),18);assert.equal(E.bonus({...g,pocchiAs:'m3'},25000,null,goldRule),8);
});
test('topaz and amethyst white are distinct and both stay legal physical white tiles',()=>{
 const r=E.rule({gemSelection:['topaz','amethyst-white']}),w=new M.Shan(r)._pai;assert.ok(w.includes('z0')&&w.includes('zA'));const h=M.Shoupai.fromString('m12p123s123z11555zA*');assert.equal(M.Util.hule(h,null,M.Util.hule_param({rule:r,lizhi:1})).pocchiAs,'m3');
});
test('mixed catalog presets finish seeded CPU games with conserved points and chips',()=>{
 const random=Math.random;let seed=294823;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const presets=[['lapis','emerald','pearl','amethyst-p','tourmaline','amethyst-s','amethyst-white','gold-pocchi','gane-pocchi'],['ruby','silver','aquamarine','crystal','topaz'],['turquoise','black-diamond','garnet','tourmaline','gold-pocchi'],['carnelian','pearl','crystal','gane-pocchi']];
 try{for(const gemSelection of presets)for(let i=0;i<3;i++){let result;const players=Array.from({length:4},()=>new E.Player((o,r,msg,p)=>r(E.cpu(p,o))));new E.Game(players,p=>result=p,{gemSelection}).do_sync();assert.ok(result);assert.equal(result.defen.reduce((a,b)=>a+b),100000);assert.equal(result.bonusChips.reduce((a,b)=>a+b),0);}}
 finally{Math.random=random;}
});
test('turquoise can form open nine gates but cannot be discarded to declare open riichi',()=>{
 const r=E.rule({gemSelection:['turquoise']}),h=M.Shoupai.fromString('p11406789995,p123-');
 const rv=M.Util.hule(h,null,M.Util.hule_param({rule:r,menfeng:1}));assert.ok(rv.hupai.some(y=>y.name.includes('九蓮')));assert.ok(!rv.hupai.some(y=>y.name.includes('四暗刻')));
 const reach=M.Shoupai.fromString('m123p055s789z33,p123-');assert.equal(M.Game.allow_lizhi(r,reach,'p0',50,25000),false);assert.equal(M.Game.allow_lizhi(r,reach,'p5',50,25000),true);
});

require('node:assert/strict').deepEqual(require('../offline/jewels').rawTiles('m3-45,p55+5,s777=7'),['m3','m4','m5','p5','p5','p5','s7','s7','s7','s7']);
