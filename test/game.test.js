const test=require('node:test');const assert=require('node:assert/strict');
const {createWall,createGame,discard,playerView}=require('../game');
const ids=['a','b','c','d'];
test('Wall consists of 136 unique tiles and exactly four jewel replacements',()=>{const wall=createWall();assert.equal(wall.length,136);assert.equal(new Set(wall.map(x=>x.id)).size,136);assert.equal(wall.filter(x=>x.jewel).length,4);});
test('Dealing is 14/13/13/13 and concealed hands stay private',()=>{const g=createGame(ids);assert.deepEqual(ids.map(id=>g.hands[id].length),[14,13,13,13]);const v=playerView(g,'b');assert.equal(v.yourHand.length,13);assert.equal('hands' in v,false);assert.equal(g.wall.length,83);});
test('Only current player can discard a tile they actually own',()=>{const g=createGame(ids);const id=g.hands.a[0].id;assert.throws(()=>discard(g,'b',g.hands.b[0].id),/番/);assert.throws(()=>discard(g,'a','invalid'),/持って/);discard(g,'a',id);assert.equal(g.discards.a.length,1);assert.equal(g.turn,1);assert.equal(g.hands.b.length,14);assert.equal(g.hands.a.length,13);});
