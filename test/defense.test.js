'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),analyze=require('../offline/defense');
const risk=(tile,visible=[],river=[])=>analyze({tile,visible:new Map(visible),river});
test('genbutsu is zero risk including honors',()=>{for(const t of ['m5','z1'])assert.equal(risk(t,[],[t]).score,0);});
test('central tile has more possible sequence combinations than terminal or honor',()=>{assert.ok(risk('m5').combinations>risk('m1').combinations);assert.ok(risk('m1').combinations>risk('z1').combinations);});
test('visible tiles remove exact wait combinations',()=>{assert.equal(risk('m5',[['m3',4],['m4',4],['m6',4],['m7',4],['m5',4]]).score,0);assert.equal(risk('z1',[['z1',4]]).score,0);});
test('suji only removes furiten ryanmen, not kanchan and shanpon',()=>{const r=risk('m4',[],['m1']);assert.equal(r.shapes.some(s=>s.tiles.join(',')==='m2,m3'),false);assert.ok(r.shapes.some(s=>s.tiles.join(',')==='m3,m5'));assert.ok(r.score>0);assert.ok(r.pairs<risk('m4').pairs);});
test('all inputs remain unchanged and index stays bounded',()=>{const v=new Map([['m2',3]]),before=[...v],river=['m1'];const r=analyze({tile:'m4',visible:v,river});assert.deepEqual([...v],before);assert.deepEqual(river,['m1']);assert.ok(r.score>=0&&r.score<1);});
