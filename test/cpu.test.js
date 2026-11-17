'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine');
function player(text,rule=E.rule()){return {_menfeng:1,_id:1,shoupai:E.M.Shoupai.fromString(text),_rule:rule,model:{zhuangfeng:0,player_id:[0,1,2,3],defen:[25000,25000,25000,25000],shan:{baopai:['m1']},he:Array.from({length:4},()=>({_pai:[]})),shoupai:Array.from({length:4},()=>({_fulou:[],lizhi:false}))}};}
const discard=tiles=>tiles.map(t=>({reply:{dapai:t}}));
test('keep amethyst instead of an interchangeable ordinary five',()=>{
 const p=player('m123p055s789z1155p5'),before=p.shoupai.toString();assert.equal(E.cpu(p,discard(['p0','p5'])).dapai,'p5');assert.equal(p.shoupai.toString(),before);
});
test('do not sacrifice shanten for an isolated gold pocchi',()=>{
 const p=player('m123p456s789z1155z8',E.rule({gemSelection:['gold-pocchi']}));assert.equal(E.cpu(p,discard(['m1','z8_'])).dapai,'z8_');
});
test('prefer live waits over exhausted waits using public discards',()=>{
 const p=player('m123p123s456789z11',E.rule({gemSelection:[]}));p.model.he[0]._pai=['m1','m1','m1','m4','m4','m4','m4'];assert.equal(E.cpu(p,discard(['m1','p1'])).dapai,'p1');
});
test('take a known safe discard against riichi when hand speed is equal',()=>{
 const p=player('m123p123s456789z11');p.model.shoupai[0].lizhi=true;p.model.he[0]._pai=['p1*'];assert.equal(E.cpu(p,discard(['m1','p1'])).dapai,'p1');
});
test('cannot inspect other concealed hands, wall or ura indicators',()=>{
 const p=player('m123p055s789z1155p5');for(const h of p.model.shoupai)Object.defineProperty(h,'_bingpai',{get(){throw Error('hidden hand');}});for(const k of ['_pai','fubaopai'])Object.defineProperty(p.model.shan,k,{get(){throw Error('hidden wall');}});assert.ok(E.cpu(p,discard(['p0','p5'])).dapai);
});
test('choose carnelian mode by actual points plus chips, not first offered option',()=>{
 const p=player('m123p406s789z11555',E.rule({gemSelection:['carnelian']}));const o=['chips','han'].map(jewelChoice=>({reply:{hule:'-',jewelChoice}}));assert.equal(E.cpu(p,o).jewelChoice,'han');
});
test('riichi CPU keeps the only legal physical draw discard',()=>{
 const p=player('m123p555s789z1155*');p.shoupai.zimo('p5');assert.deepEqual(E.cpu(p,discard(['p5_'])),{dapai:'p5_'});
});

test('chi that advances a hand with a concealed white triplet preserves a real yaku',()=>{
 const p=player('m239p456s78z11555',E.rule({gemSelection:[]}));assert.deepEqual(E.cpu(p,[{reply:{fulou:'m1-23'}},{reply:{}}]),{fulou:'m1-23'});
});
test('decline a yaku-less chi even if it advances the hand',()=>{
 const p=player('m239p456s78z11444',E.rule({gemSelection:[]}));assert.deepEqual(E.cpu(p,[{reply:{fulou:'m1-23'}},{reply:{}}]),{});
});
test('avoid a public open-riichi winning tile even when folding costs hand speed',()=>{
 const p=player('m123p123s456789z11',E.rule({gemSelection:[]}));p.model.openRiichi=[true,false,false,false];p.model.shoupai[0]=E.M.Shoupai.fromString('m23p123s123z11555*');
 assert.equal(E.cpu(p,discard(['m1','s4'])).dapai,'s4');
 assert.equal(E.cpu(p,discard(['m1'])).dapai,'m1');
});
test('recognize special physical tiles as open-riichi winning tiles',()=>{
 const p=player('m123p055s789z1155p5');p.model.openRiichi=[true,false,false,false];p.model.shoupai[0]=E.M.Shoupai.fromString('m123p46s123z11555*');
 assert.equal(E.cpu(p,discard(['p0','z1'])).dapai,'z1');
});
