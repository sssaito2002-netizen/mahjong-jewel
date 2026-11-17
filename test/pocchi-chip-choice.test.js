'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine'),{M,J}=E;
function fixture(ids=['gane-pocchi'],text='m234p456s78z11555z9*',indicators=['m1']){
 const rule=E.rule({gemSelection:ids,unlockedYaku:null}),hand=M.Shoupai.fromString(text),param=M.Util.hule_param({rule,menfeng:1,lizhi:1,baopai:indicators,fubaopai:['p7']});
 const result=M.Util.hule(hand,null,param),event={...result,shoupai:hand.toString(),baojia:null,indicators,garnetUra:['p7']};return {rule,hand,param,result,event};
}
test('69s north-pocchi tsumo chooses nine chips when both wins score 8000',()=>{
 const {rule,hand,param,result,event}=fixture();
 for(const tile of ['s6','s9'])assert.equal(M.Util.hule(hand.clone().dapai('z9').zimo(tile),null,{...param,pocchi:'z9'}).defen,8000);
 assert.equal(result.pocchiAs,'s9');assert.equal(J.bonus(event,25000,null,rule),9);
 const line=J.bonusBreakdown(event,25000,null,rule).lines.find(l=>l.label==='ガネクリ北ポッチ');assert.equal(line.amount,9);assert.match(line.reason,/クリスタル9/);
});
test('physical crystal and north-pocchi both use the selected nine as the winning number',()=>{
 const {rule,result,event}=fixture(['crystal','gane-pocchi'],'m123p55s03478z555z9*',['p2']);assert.equal(result.pocchiAs,'s9');
 const lines=J.bonusBreakdown(event,25000,null,rule).lines;assert.equal(lines.find(l=>l.label==='クリスタル').amount,9);assert.equal(lines.find(l=>l.label==='ガネクリ北ポッチ').amount,9);assert.equal(J.bonus(event,25000,null,rule),18);
});
test('point value still takes priority over chips when six is a higher-scoring win',()=>{
 const {result}=fixture(['gane-pocchi'],'m234p456s78z11555z9*',['s5']);assert.equal(result.pocchiAs,'s6');assert.equal(result.defen,8000);
});
test('ordinary winning six stays six and ordinary nine stays nine',()=>{
 const rule=E.rule({gemSelection:['gane-pocchi']});for(const number of [6,9]){const hand=M.Shoupai.fromString('m234p456s78z11449').zimo('s'+number);const result=M.Util.hule(hand,null,M.Util.hule_param({rule,menfeng:1,lizhi:1,baopai:['m1']}));assert.equal(result.pocchiAs,undefined);const event={...result,shoupai:hand.toString(),winningTile:hand._zimo,indicators:['m1'],garnetUra:[],baojia:null};assert.equal(J.bonus(event,25000,null,rule),number);}
});
test('actual Game.hule settles north-pocchi 69s as nine per payer and emits that breakdown',()=>{
 const {hand}=fixture(),g=new E.Game([],()=>{},{gemSelection:['gane-pocchi'],unlockedYaku:null});
 g._paipu={log:[[]]};g._status='zimo';g._hule=[];g._diyizimo=false;g._lizhi=[0,1,0,0];g._yifa=[0,0,0,0];g._changbang=0;g._lianzhuang=false;
 const m=g.model;m.player_id=[0,1,2,3];m.lunban=1;m.shoupai=Array.from({length:4},()=>new M.Shoupai());m.shoupai[1]=hand;m.shan=new M.Shan(g._rule);m.shan._baopai=['m1'];m.shan._fubaopai=['p7'];
 let event;g.call_players=(type,msg)=>{event=msg[0].hule;};g.hule();assert.equal(event.pocchiAs,'s9');assert.equal(event.jewelChips,9);assert.equal(event.jewelTotal,27);assert.equal(event.chipBreakdown.perPayer,9);assert.deepEqual(g.chips,[-9,27,-9,-9]);
});
