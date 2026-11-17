'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),D=require('../offline/sanma/dan');
test('DAN rank boundary 40,000 transfers the second-place deduction to the winner',()=>{
 for(const [points,expected]of [[[40000,40000,25000],[10,0,-10]],[[41000,39999,24001],[13,-3,-10]],[[35000,35000,35000],[13,-3,-10]]]){
  const before=points.slice(),r=D.rankSettlement(points);
  assert.deepEqual(r.delta,expected);assert.deepEqual(points,before);assert.equal(r.delta.reduce((a,b)=>a+b),0);assert(r.results.every(r=>r.score===0));
 }
});
test('DAN 80,000 top receives exactly two from each opponent on top of rank chips',()=>{
 assert.deepEqual(D.rankSettlement([79999,15001,10000]).delta,[13,-3,-10]);
 const r=D.rankSettlement([80000,15000,10000]);assert.deepEqual(r.delta,[17,-5,-12]);
 assert.deepEqual(r.ledger.filter(l=>l.label==='8万点以上トップ').map(l=>[l.from,l.to,l.amount]),[[1,0,2],[2,0,2]]);
 assert.deepEqual(D.rankSettlement([10000,80000,15000]).delta,[-12,17,-5]);
});
test('DAN ties use original seat order, including rotated initial dealer',()=>{
 assert.deepEqual(D.rankSettlement([35000,35000,35000],{initialDealer:2}).order,[2,0,1]);
 for(const points of [[],[1,2],[1,2,NaN],[1,2,0.5]])assert.throws(()=>D.rankSettlement(points));
});
test('DAN wall has 112 physical tiles and exactly four of every logical tile',()=>{
 const wall=D.wall(),groups=new Map();assert.equal(wall.length,112);
 for(const t of wall){const a=groups.get(t.base)||[];a.push(t);groups.set(t.base,a);}
 for(const group of groups.values())assert.equal(group.length,4);
 for(const b of ['m5','p5','s5'])assert.deepEqual(groups.get(b).map(t=>D.COLORS[t.color]),[3,2,1,0]);
 for(const b of ['p3','p7','s3','s7'])assert.deepEqual(groups.get(b).map(t=>D.COLORS[t.color]),[2,1,0,0]);
 assert.equal(wall.filter(t=>t.extracted).length,4);assert(wall.filter(t=>t.extracted).every(t=>t.base==='m5'));
 assert.deepEqual(groups.get('z5').map(t=>t.pocchi),['normal','double',null,null]);
 assert(!groups.has('m2'));assert.equal(D.SPEC.startingPoints,35000);
});
test('DAN counted yakuman starts at 13 and five mangan at 16 without overriding real yakuman',()=>{
 for(const n of [13,14,15])assert.equal(D.limit(n).label,'数え役満');
 assert.equal(D.limit(12).label,'三倍満');assert.equal(D.limit(16).base,10000);
 assert.equal(D.limit(20,1).base,8000);assert.equal(D.limit(20,1).counted,false);
});
test('DAN colored visible indicators transfer color to the next logical dora',()=>{
 assert.deepEqual(D.visibleEffect({base:'p5',color:'red'}),{target:'p6',color:'red',pocchi:null});
 assert.deepEqual(D.visibleEffect({base:'s5',color:'platinum'}),{target:'s6',color:'platinum',pocchi:null});
 assert.equal(D.visibleEffect({base:'m5',color:'gold'}).target,'m9');
 for(const pocchi of ['normal','double'])assert.deepEqual(D.visibleEffect({base:'z5',pocchi}),{target:'z5',pocchi,color:null});
});
test('DAN hidden ordinary pocchi chooses normal dora; double pocchi can choose platinum',()=>{
 assert.deepEqual(D.hiddenChoice({base:'z5',pocchi:'normal'},{base:'p6'}),{target:'p6',color:null,pocchi:null});
 assert.deepEqual(D.hiddenChoice({base:'z5',pocchi:'double'},{base:'p5',color:'platinum'}),{target:'p5',color:'platinum',pocchi:null});
 assert.throws(()=>D.hiddenChoice({base:'z5',pocchi:'normal'},{base:'p5',color:'platinum'}));
 assert.throws(()=>D.hiddenChoice({base:'z5'},{base:'p5'}));assert.throws(()=>D.tile({base:'m2'}));
});
