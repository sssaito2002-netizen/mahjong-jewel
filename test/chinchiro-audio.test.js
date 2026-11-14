'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),A=require('../public/offline/chinchiro-audio');
test('reach cues distinguish a winning chance, hifumi danger and a normal point',()=>{
 assert.equal(A.classify([1,2]),'danger');assert.equal(A.classify([2,3]),'danger');assert.equal(A.classify([1,3]),'danger');
 assert.equal(A.classify([6,6]),'chance');assert.equal(A.classify([4,5]),'chance');assert.equal(A.classify([1,6]),null);
});
test('role confirmation explodes for specials and leaves ordinary results silent',()=>{
 for(const faces of [[1,1,1],[2,2,2],[6,6,6],[6,4,5]])assert.equal(A.classify(faces),'boom');
 assert.equal(A.classify([3,1,2]),'crash');assert.equal(A.classify([3],[1,2]),'crash');
 assert.equal(A.classify([6],[6,6]),'boom');assert.equal(A.classify([2,2,4]),null);assert.equal(A.classify([1,4,6]),null);
});
test('sound preference can be disabled without a browser or audio device',()=>{
 A.setEnabled(false);assert.equal(A.enabled,false);assert.equal(A.cue([1,1,1]),'boom');A.stop();A.setEnabled(true);assert.equal(A.enabled,true);
});
