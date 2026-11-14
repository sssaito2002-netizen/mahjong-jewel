'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine');
function fixture({ron=false,tobi=false}={}){
 const g=new E.Game([],()=>{},{gemSelection:['gold','amethyst-p'],unlockedYaku:'翻牌 白'});
 g._paipu={log:[[]]};g._status=ron?'dapai':'zimo';g._hule=ron?[1]:[];g._diyizimo=false;g._lizhi=[0,0,0,0];g._yifa=[0,0,0,0];g._changbang=0;g._lianzhuang=false;g._dapai='z5';
 const m=g.model;m.player_id=[2,3,0,1];m.lunban=ron?0:1;m.shoupai=Array.from({length:4},()=>new E.M.Shoupai());m.shoupai[1]=E.M.Shoupai.fromString(ron?'m123p0A5s789z1155':'m123p0A5s789z11555');m.shan=new E.M.Shan(g._rule);m.shan._baopai=['m8'];m.shan._fubaopai=[];
 if(tobi){m.defen[2]=7000;m.defen[0]+=18000;}
 let event;g.call_players=(type,msg)=>{event=msg[0];};g.last=()=>{};g.delay=f=>f();
 return {g,getEvent:()=>event};
}
test('real tsumo of 20 per payer moves +60/-20 and emits player-ID balances before east ends',()=>{
 const {g,getEvent}=fixture();g.hule();const h=getEvent().hule;
 assert.equal(h.defen,12000);assert.equal(h.jewelChips,20);assert.equal(h.jewelTotal,60);assert.equal(h.chipWinner,3);assert.equal(h.chipLoser,null);
 assert.deepEqual(g.chips,[-20,-20,-20,60]);assert.deepEqual(h.chipBalances,g.chips);assert.deepEqual(h.chipDelta,g.chips);
 const snapshot=h.chipBalances.slice();g.reply_hule();assert.deepEqual(g.chips,snapshot);assert.equal(g.model.defen.reduce((a,b)=>a+b),100000);
 const q={qipai:{}};g.add_paipu(q);assert.deepEqual(q.qipai.chipBalances,snapshot);assert.deepEqual(h.chipBalances,snapshot);
});
test('real ron charges only the discarder, and a bust adds exactly 10 chips',()=>{
 for(const tobi of [false,true]){const {g,getEvent}=fixture({ron:true,tobi});g.hule();const h=getEvent().hule,n=tobi?30:20;
  assert.equal(h.jewelChips,20);assert.equal(h.jewelTotal,20);assert.equal(h.chipLoser,2);assert.deepEqual(g.chips,[0,0,-n,n]);assert.deepEqual(h.chipDelta,g.chips);assert.equal(h.tobi.length,tobi?1:0);assert.equal(h.chipBalances.reduce((a,b)=>a+b),0);
 }
});
test('east-end persistence retains the actual win ledger once and keeps rank separate',()=>{
 const {g}=fixture();g.hule();g.reply_hule();g.jieju();assert.deepEqual(g._paipu.bonusChips,[-20,-20,-20,60]);
 const rows=E.settle(g._paipu);let raw=null;const storage={getItem:()=>raw,setItem:(_,v)=>raw=v};E.saveResult(storage,'east-1',rows);E.saveResult(storage,'east-1',rows);
 const saved=JSON.parse(raw);assert.equal(saved.totals[3].bonusChips,60);assert.equal(saved.totals[3].rankChips,50);assert.equal(saved.totals[3].games,1);assert.equal(saved.games.length,1);
});
test('human win confirmation holds the engine reply, including CPU wins, and replies once',()=>{
 const p=new E.Player((options,reply)=>reply({}));
 p.action({kaiju:{id:0,rule:E.rule(),title:'test',player:['a','b','c','d'],qijia:0}},()=>{});
 p.action({qipai:{zhuangfeng:0,jushu:0,changbang:0,lizhibang:0,defen:[25000,25000,25000,25000],baopai:'m8',shoupai:['m123p406s789z1155','','','']}},()=>{});
 let confirm,replies=0;p.confirmWin=(h,done)=>{assert.equal(h.l,1);confirm=done;};
 p.action({hule:{l:1,baojia:null,shoupai:'m123p0A5s789z11555',defen:12000,fenpei:[-6000,12000,-3000,-3000],hupai:[]}},()=>replies++);
 assert.equal(replies,0);assert.equal(typeof confirm,'function');confirm();confirm();assert.equal(replies,1);
});
