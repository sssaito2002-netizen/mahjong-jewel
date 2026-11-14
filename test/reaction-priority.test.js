'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine'),Gate=require('../offline/reaction-gate');
const pass={label:'見送り',reply:{}},ron={label:'ロン',reply:{hule:'-'}},pon={label:'ポン',reply:{fulou:'p555-'}};
test('calls stay hidden while ron answers are pending; ron suppresses all calls and preserves double ron',()=>{
 const gate=new Gate(),shown=[],answers=[],finished=[];
 [[pon,pass],[ron,pon,pass],[pass],[ron,pass]].forEach((o,id)=>gate.collect(o,(opts,reply)=>{shown.push({id,opts});answers[id]=reply;},r=>finished.push({id,r})));
 assert.deepEqual(shown.map(x=>x.id),[1,3]);assert(shown.every(x=>x.opts.every(a=>!a.reply.fulou)));
 answers[1]({hule:'-'});assert.equal(finished.length,0);answers[3]({hule:'-'});assert.equal(finished.length,4);assert.deepEqual(finished.filter(x=>x.r.hule).map(x=>x.id),[1,3]);assert(!shown.some(x=>x.id===0));
});
test('declining every ron reopens calls, including a winning player choosing pon, without duplicate callbacks',()=>{
 const gate=new Gate(),shown=[],answers=[],finished=[];
 [[pon,pass],[ron,pon,pass],[],[]].forEach((o,id)=>gate.collect(o,(opts,reply)=>{shown.push({id,opts});answers[id]=reply;},r=>finished.push({id,r})));
 const decline=answers[1];decline({});decline({});assert.deepEqual(shown.map(x=>x.id),[1,0,1]);assert(shown.slice(1).every(x=>x.opts.every(a=>!a.reply.hule)));answers[0]({});answers[1](pon.reply);assert.equal(finished.length,4);
});
test('four accepted riichi continue with deposit charged in normal and hard modes',()=>{
 for(const nekkyou of [false,true]){const g=new E.Game([],()=>{},{nekkyou}),m=g.model;g._sync=true;g._diyizimo=false;g._lizhi=[1,1,1,1];g._yifa=[false,false,false,false];g._neng_rong=[true,true,true,true];g._n_gang=[0,0,0,0];g._hule=[];g._dapai='z7*';g._reply=[{},{},{},{}];m.player_id=[0,1,2,3];m.lunban=3;m.lizhibang=3;m.shoupai=Array.from({length:4},()=>E.M.Shoupai.fromString('m123p123s123z1122'));m.shan={paishu:20};g.allow_hule=()=>false;let drawn=0;g.zimo=()=>drawn++;g.pingju=()=>assert.fail('four-riichi abort');g.reply_dapai();assert.equal(drawn,1);assert.equal(m.lizhibang,4);assert.equal(m.defen[3],24000);}
});
test('sanma checks ron before showing another player pon, then restores calls after a pass',()=>{
 const S=E.Sanma,g=new S.Game();g.hands=[E.M.Shoupai.fromString('p55s234678z1235'),E.M.Shoupai.fromString('p12s123789z11555'),E.M.Shoupai.fromString('p456s456789z2233')];g.beginResponses(2,'p3','react');assert.equal(g.actor,1);assert(g.actions().some(a=>a.reply.win));assert(!g.actions().some(a=>a.reply.pon));g.act({pass:true});assert.equal(g.actor,0);assert.equal(g.ronOnly,false);assert.equal(g.furiten[1],true);
});
test('real four-player dispatch resolves CPU ron without ever prompting human pon',()=>{
 const prompts=[],hands=['p33s234678z1235','m123456p456s123z1','p12s123789z11555','m123456p456s123z2'];
 const players=hands.map((_,id)=>new E.Player((options,reply)=>{prompts.push({id,options});reply(options.find(o=>o.reply.hule)?.reply||{});}));
 const rule=E.rule({gemSelection:['lapis','pearl','tourmaline']});
 players.forEach((p,id)=>{p.action({kaiju:{id,rule,title:'ron priority',player:['a','b','c','d'],qijia:0}},()=>{});p.action({qipai:{zhuangfeng:0,jushu:0,changbang:0,lizhibang:0,defen:[25000,25000,25000,25000],baopai:'m4',shoupai:hands.map((h,l)=>id===l?h:'')}},()=>{});p.action({zimo:{l:3,p:''}},()=>{});});
 prompts.length=0;const g=new E.Game(players,()=>{},rule);g._sync=true;g.call_players('dapai',Array.from({length:4},()=>({dapai:{l:3,p:'p3'}})));assert(!prompts.some(x=>x.id===0));assert(g._reply[2].hule);assert.deepEqual(g._reply[0],{});
});
test('four-riichi and four-winds aborts can be enabled independently without changing deposit timing',()=>{
 for(const type of ['riichi','winds'])for(const enabled of [false,true]){const g=new E.Game([],()=>{},{'四家立直流局あり':type==='riichi'&&enabled,'四風連打流局あり':type==='winds'&&enabled}),m=g.model;g._sync=true;g._diyizimo=type==='winds';g._fengpai=true;g._lizhi=type==='riichi'?[1,1,1,1]:[0,0,0,0];g._yifa=[false,false,false,false];g._neng_rong=[true,true,true,true];g._n_gang=[0,0,0,0];g._hule=[];g._dapai=type==='riichi'?'z7*':'z1';g._reply=[{},{},{},{}];m.player_id=[0,1,2,3];m.lunban=3;m.lizhibang=3;m.shoupai=Array.from({length:4},()=>E.M.Shoupai.fromString('m123p123s123z1122'));m.shan={paishu:20};g.allow_hule=()=>false;let drawn=0,abort=null;g.zimo=()=>drawn++;g.pingju=name=>abort=name;g.reply_dapai();assert.equal(drawn,enabled?0:1);assert.equal(abort,enabled?(type==='riichi'?'四家立直':'四風連打'):null);assert.equal(m.defen[3],type==='riichi'?24000:25000);}
});
