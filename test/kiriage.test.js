'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine');
function score(text,ron,menfeng,kiriage=true,extra={}){return E.M.Util.hule(E.M.Shoupai.fromString(text),ron,E.M.Util.hule_param({rule:E.rule({gemSelection:[],'切り上げ満貫あり':kiriage}),menfeng,lizhi:1,...extra}));}
test('kiriage is on by default',()=>assert.equal(E.rule()['切り上げ満貫あり'],true));
test('four han thirty fu ron rounds child 7700 and dealer 11600',()=>{
 for(const seat of [0,1]){const r=score('m123456p123s23z44','s1+',seat),before=score('m123456p123s23z44','s1+',seat,false);assert.equal(r.fanshu,4);assert.equal(r.fu,30);assert.equal(r.defen,seat===0?12000:8000);assert.equal(before.defen,seat===0?11600:7700);}
});
test('three han sixty fu is also mangan',()=>{
 for(const seat of [0,1]){const r=score('m23s678z11,z5555,p456-','m1+',seat,true,{lizhi:0,baopai:['z4']});assert.equal(r.fanshu,3);assert.equal(r.fu,60);assert.equal(r.defen,seat===0?12000:8000);}
});
test('tsumo rounds all payments to mangan',()=>{
 for(const seat of [0,1]){const r=score('m123p456s789z44555',null,seat,true,{baopai:['m1']});assert.equal(r.fanshu,4);assert.equal(r.fu,30);assert.equal(r.defen,seat===0?12000:8000);}
});
