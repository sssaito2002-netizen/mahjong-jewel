'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine');
test('unlocked yaku pool contains no value-honor yaku',()=>{
 assert.equal(E.UNLOCK_YAKU.length,16);assert.ok(E.UNLOCK_YAKU.every(y=>!/(翻牌|役牌|場風|自風)/.test(y)));
 for(let n=0;n<100;n++){const g=new E.Game([],()=>{});assert.ok(E.UNLOCK_YAKU.includes(g._rule.unlockedYaku));}
});
test('riichi discards preserve physical identity and expose only tsumogiri, even for a duplicate draw',()=>{
 for(const [text,tile]of [['m123p555s789z1155*','p5'],['m123p055s789z1155*','pA'],['m123p555s789z1155*','z9']]){
  const hand=E.M.Shoupai.fromString(text).zimo(tile);assert.equal(hand.lizhi,true);assert.deepEqual(hand.get_dapai(),[tile+'_']);assert.deepEqual(E.M.Game.get_dapai(E.rule(),hand),[tile+'_']);
 }
});
test('action boundary rejects hand discards and abortive draws after riichi while retaining legal kan',()=>{
 const hand=E.M.Shoupai.fromString('m123p555s789z1155*').zimo('p5'),rule=E.rule({gemSelection:[]});
 const kans=E.M.Game.get_gang_mianzi(rule,hand,null,50,0);assert.ok(kans.includes('p5555'));
 const p={_menfeng:0,shoupai:hand,_rule:rule,allow_hule:()=>false,get_gang_mianzi:()=>kans,allow_pingju:()=>true,get_dapai:()=>['m1','p5_'],allow_lizhi:()=>false};
 const opts=E.actions(p,{zimo:{l:0,p:'p5'}});assert.deepEqual(opts.filter(o=>o.reply.dapai).map(o=>o.reply.dapai),['p5_']);assert.ok(opts.some(o=>o.reply.gang==='p5555'));assert.ok(!opts.some(o=>o.reply.pingju));
});
