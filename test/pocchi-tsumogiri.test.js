'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine'),{M,J}=E;
function player(text,rule,seat=1){const p=new E.Player(()=>{});p._id=seat;p._menfeng=seat;p._rule=rule;p._neng_rong=true;p._model={zhuangfeng:0,player_id:[0,1,2,3],defen:[25000,25000,25000,25000],shan:{paishu:30,baopai:['m3']},he:Array.from({length:4},()=>({_pai:[]})),shoupai:Array.from({length:4},(_,i)=>i===seat?M.Shoupai.fromString(text):M.Shoupai.fromString(''))};p.message={zimo:{l:seat,p:p.shoupai._zimo}};return p;}
test('all riichi pocchi and CPU seats offer only wins, never a discard',()=>{
 for(const ids of [['amethyst-white'],['topaz','amethyst-white','gold-pocchi','gane-pocchi']])for(const nekkyou of [false,true])for(let seat=0;seat<4;seat++){
  const rule=E.rule({gemSelection:ids,nekkyou});for(const [tile,gem]of Object.entries(rule.gemTiles)){
   const p=player('m12p123s123z11555'+tile+'*',rule,seat),before=p.shoupai.toString(),options=E.actions(p,p.message);
   assert.ok(options.length,tile);assert.ok(options.every(a=>a.reply.hule),tile);assert.ok(E.cpu(p,options).hule,tile);assert.equal(p.shoupai.toString(),before);
  }
 }
});
function game(hand,rule){const g=new E.Game([],()=>{},rule),m=g.model;m.player_id=[0,1,2,3];m.lunban=1;m.zhuangfeng=0;m.shan={paishu:30};m.shoupai=[M.Shoupai.fromString(''),M.Shoupai.fromString(hand),M.Shoupai.fromString(''),M.Shoupai.fromString('')];g._status='zimo';g._reply=[{},{dapai:m.shoupai[1]._zimo+'_'},{},{}];g.say=()=>{};g.delay=callback=>callback();return g;}
test('authoritative turn converts a stale wildcard discard into a real scored win',()=>{
 for(const tile of ['z0','zA']){const rule={gemSelection:['topaz','amethyst-white']},g=game('m12p123s123z11555'+tile+'*',rule);let won=false;g.hule=()=>{won=true;};g.dapai=()=>assert.fail('winning pocchi must not be discarded');g.reply_zimo();assert.ok(won);assert.deepEqual(g.get_reply(1),{hule:'-'});}
});
test('an unready hand is never auto-awarded a wildcard win',()=>{const g=game('m13579p13579s123z0*',{gemSelection:['amethyst-white']});assert.equal(g.allow_hule(),false);let discarded;g.dapai=t=>{discarded=t;};g.hule=()=>assert.fail('not ready');g.reply_zimo();assert.equal(discarded,'z0_');});
test('before riichi amethyst stays an ordinary white; normal post-riichi draws can discard',()=>{
 const r=E.rule({gemSelection:['amethyst-white']});for(const text of ['m12p123s123z11555z0','m12p123s123z11555p9*']){const p=player(text,r),options=E.actions(p,p.message);assert.ok(options.some(a=>a.reply.dapai));assert.ok(!options.some(a=>a.reply.hule));}
});
