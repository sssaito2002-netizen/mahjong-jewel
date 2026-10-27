const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const ctx={};vm.runInNewContext(fs.readFileSync('public/ranking.js','utf8'),ctx);
const {settleRound,updateTotals}=ctx.JewelRanking;
const input=[{id:'a',name:'A',points:25000,seatOrder:0,bonusChips:4},{id:'b',name:'B',points:30000,seatOrder:1,bonusChips:-4},{id:'c',name:'C',points:20000,seatOrder:2,bonusChips:0},{id:'d',name:'D',points:25000,seatOrder:3,bonusChips:0}];
const r=settleRound(input);assert.deepEqual(Array.from(r,x=>x.id),['b','a','d','c']);assert.deepEqual(Array.from(r,x=>x.rankChips),[50,25,-25,-50]);assert.equal(updateTotals({},r).b,46);assert.equal(updateTotals({b:10},r).b,56);assert.throws(()=>settleRound(input.slice(0,3)));console.log('ranking tests passed');
