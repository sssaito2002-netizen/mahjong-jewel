'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),E=require('../offline/engine'),C=E.Sanma.Custom,T=E.TileChips;
test('point and rank settlements convert to chips, preserve bonuses and are zero sum',()=>{
 const p=[50000,35000,20000],order=[0,1,2],bonus=[4,-1,-3],c={...C.defaults(),chipPoint:5};
 let r=C.finish(p,order,c,bonus);a.deepEqual(r.map(x=>x.score),[45,-5,-40]);a.deepEqual(r.map(x=>x.rankChips+x.bonusChips),[13,-2,-11]);
 r=C.finish(p,order,{...c,settlement:'rank'},bonus);a.deepEqual(r.map(x=>x.score),[20,0,-20]);a.deepEqual(r.map(x=>x.rankChips+x.bonusChips),[8,-1,-7]);
 const g=new E.Sanma.Game({customSanma:{...c,settlement:'rank'}});g.points=p;g.chips=bonus;g.finish();a.deepEqual(g.results,r);a.equal(g.exportReplay().rules.settings.customSanma.chipPoint,5);
 for(const v of [0,-1,NaN,Infinity,0.15,1001])a.throws(()=>C.validate({...c,chipPoint:v}));a.throws(()=>C.validate({...c,settlement:'bad'}));
});
test('tile frame colors validate, survive config and do not change bonus calculations',()=>{
 const rows=[{tile:'p7',chips:3,color:'#ABCDEF'}];a.deepEqual(T.validate(rows),[{tile:'p7',chips:3,color:'#abcdef'}]);a.equal(T.breakdown(rows,['p7','p7'])[0].amount,6);
 for(const color of ['red','#123','url(test)',null])a.throws(()=>T.validate([{...rows[0],color}]));
 const four=E.CustomFour.validate({...E.CustomFour.example(),tiles:[{base:'p5',slot:0,name:'緑',chips:2,color:'#12ab34'}]});a.equal(E.CustomFour.gems(four).p0.color,'#12ab34');
 const c=C.validate({...C.defaults(),tileChips:rows});a.equal(E.Sanma.options({customSanma:c}).customSanma.tileChips[0].color,'#abcdef');
});
