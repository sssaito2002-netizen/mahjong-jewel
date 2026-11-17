'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine'),C=E.CustomFour;
test('custom names and chip values validate without changing legacy catalogs',()=>{
 const c=C.example(),old=JSON.stringify(E.J.CATALOG),r=E.rule({customFour:c});
 assert.equal(r.customRuleName,c.name);assert.equal(r.jewelBonus,false);assert.equal(r.fullJewel,false);assert.equal(r.unlockedYaku,null);
 c.tiles[0].name='変更後';assert.equal(r.gemTiles.m0.name,'金');assert.equal(JSON.stringify(E.J.CATALOG),old);
 for(const edit of [p=>p.tiles.push({...p.tiles[0]}),p=>p.tiles[0].chips=-1,p=>p.tiles[0].chips=1.5,p=>p.tiles[0].slot=4,p=>p.name='',p=>p.rankChips=[1,2,3,4]]){const p=C.example();edit(p);assert.throws(()=>C.validate(p));}
 assert.throws(()=>E.rule({customFour:C.example(),nekkyou:true}));
});
test('four special copies preserve 136 tiles and reject a fifth logical copy',()=>{
 const p=C.example();p.tiles.push({base:'m5',slot:3,name:'四枚目',chips:8});
 const wall=new E.M.Shan(E.rule({customFour:p}))._pai;assert.equal(wall.length,136);assert.equal(wall.filter(t=>E.M.Shoupai.normal_pai(t)==='m5').length,4);
 for(const t of ['m0','mA','mB','mC'])assert.equal(wall.filter(x=>x===t).length,1);
 assert.throws(()=>new E.M.Shoupai(['m0','mA','mB','mC','m5']));
});
test('third and fourth fives retain identity through discard, chi, pon, kan and serialization',()=>{
 const M=E.M,h=M.Shoupai.fromString('m0ABCp123s123z111');
 assert.equal(M.Shoupai.fromString(h.toString()).toString(),h.toString());h.zimo('z2');
 assert.deepEqual(h.get_dapai().filter(t=>t[0]==='m').sort(),['m0','mA','mB','mC']);
 for(const t of ['m0','mA','mB','mC'])assert.equal(h.clone().dapai(t)._bingpai.m[5],3);
 const ready=M.Shoupai.fromString('m0ABp123s123z1122');assert(ready.get_peng_mianzi('mC+').some(m=>m.includes('C+')));
 const kan=h.get_gang_mianzi().find(m=>M.Shoupai.normal_pai(m)==='m5555');assert(kan);assert.equal(h.clone().gang(kan)._bingpai.m[5],0);
 const seq=M.Shoupai.fromString('m4Bp123s123z11122');assert(seq.get_chi_mianzi('m6-').some(m=>m.includes('B')));
 assert.equal(E.J.number('mB'),5);assert.equal(E.J.number('mC'),5);
});
test('receipts use custom names and exact ippatsu and ura multipliers',()=>{
 const r=E.rule({customFour:C.example()}),h={shoupai:'m123p0ABs789z1155',fanshu:9,baojia:1,hupai:[{name:'一発',fanshu:1},{name:'裏ドラ',fanshu:3}]},b=E.J.bonusBreakdown(h,25000,null,r);
 assert.equal(b.perPayer,20);assert.equal(b.multiplier,1);assert.deepEqual(b.lines.map(l=>[l.label,l.amount]),[['一発',2],['裏ドラ',6],['金',2],['プラチナ',4],['マリン',6]]);
});
test('custom rank and replay settlement use a recorded snapshot',()=>{
 const customFour=C.example(),rows=E.settle({customFour,defen:[40000,30000,20000,10000],rank:[1,2,3,4],bonusChips:[6,-2,-2,-2]});
 assert.deepEqual(rows.map(r=>r.rankChips),[20,5,-5,-20]);assert.equal(rows.reduce((n,r)=>n+r.rankChips+r.bonusChips,0),0);
 const snapshot=E.Replay.rules4(E.rule({customFour}));customFour.tiles[0].name='後から編集';assert.equal(snapshot.settings.customFour.tiles[0].name,'金');
});
test('online custom settings require host authority, invalidate readiness and retain the exact game rule',()=>{
 const {Rooms}=require('../online/rooms'),rooms=new Rooms({turnMs:100000});
 try{
 const a=rooms.create('A'),b=rooms.join(a.room,'B'),{r,m}=rooms.auth(a.room,a.token),guest=rooms.auth(b.room,b.token).m;
 const customFour=C.example();guest.ready=true;
 assert.throws(()=>rooms.command(r,guest,{type:'configure',customFour}),/オーナー/);
 rooms.command(r,m,{type:'configure',customFour,selection:[]});
 assert.equal(guest.ready,false);assert.equal(r.customFour.name,customFour.name);
 const lobby=guest.events.filter(e=>e.type==='lobby').at(-1);assert(lobby);
 for(const p of r.members)rooms.command(r,p,{type:'ready',ready:true});
 rooms.command(r,m,{type:'start'});
 assert.deepEqual(r.game._rule.customFour,C.validate(customFour));
 assert.equal(r.game._rule.gemTiles.pB.name,'マリン');
 assert.throws(()=>rooms.command(r,m,{type:'configure',customFour}),/開始前/);
 }finally{rooms.close();}
});
