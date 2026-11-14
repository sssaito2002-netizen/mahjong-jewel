'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../public/offline/chinchiro-core');
function roll(g,faces){if(g.nextCount===2){g.roll(faces.slice(0,2));g.roll(faces.slice(2));}else g.roll(faces);}
for(const mode of ['normal','reach'])for(const settlement of ['classic','compare'])test(mode+'/'+settlement+' child special roles beat parent 6/1/hifumi with the winning multiplier',()=>{
 for(const child of [[1,1,1],[2,2,2],[6,6,6],[4,5,6]])for(const parent of [[2,2,6],[2,2,1],[1,2,3],[3,3,4]]){
  let g=new C.Game({names:['親','子','他の子'],stake:10,mode,settlement});roll(g,child);g=C.Game.restore(g.snapshot());g.next();roll(g,[2,2,4]);g.next();roll(g,parent);const record=g.state.ledger.find(x=>x.child===1);assert.equal(record.delta,C.evaluate(child).multiplier*10);assert.equal(g.state.ledger.length,2);assert.equal(g.state.scores.reduce((a,b)=>a+b),3000);assert.deepEqual(C.Game.restore(g.snapshot()).state.scores,g.state.scores);
 }
});
test('child triple loses to parent pin, and equal triples follow tie option at threefold',()=>{for(const tie of ['parent','push'])for(const parent of [[1,1,1],[3,3,3]]){const g=new C.Game({names:['親','子'],tie});roll(g,[3,3,3]);g.next();roll(g,parent);assert.equal(g.state.ledger[0].delta,parent[0]===1?-50:tie==='parent'?-30:0);}});
