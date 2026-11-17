'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),E=require('../offline/engine'),S=E.Sanma;
function game(){const g=new S.Game({customSanma:S.Custom.dan()});g.dead=['z7','z7'];g.extractedTiles=[[],[],[]];g.north=[0,0,0];g.danChoices=[[],[],[]];g.ippatsu=[false,false,false];g.rinshan=false;g.wall=['p9'];g.draws=[2,2,2];g.anyCalls=true;return g;}
test('common north alone permits an open ron for every seat in both east and south rounds',()=>{
 for(const round of [1,4])for(const id of [0,1,2]){
  const g=game();g.round=round;g.rule['場風牌']=[round>3?2:1];g.hands[id]=E.M.Shoupai.fromString('p123s45678z22,z444-');
  const r=g.score(id,g.hands[id],'s9+',{honba:0,preview:true});a(r);a.deepEqual(r.yaku,[{name:'役牌 北',fanshu:1}]);a.equal(r.han,1);
  const from=(id+1)%3;g.last={from,tile:'s9'};g.phase='response';a.equal(g.canRon(id),true);
 }
});
test('north pair is valued for fu and cannot qualify for pinfu; north kan counts once',()=>{
 const g=game(),pair=E.M.Shoupai.fromString('p123456s45678z44'),r=g.score(1,pair,'s9+',{honba:0,preview:true});a.equal(r,null);
 const kan=E.M.Shoupai.fromString('p123s45678z22,z4444');const k=g.score(1,kan,'s9+',{honba:0,preview:true});a(k);a.equal(k.yaku.filter(y=>y.name==='役牌 北').length,1);
 const h=E.M.Util.hule(pair,'s9+',E.M.Util.hule_param({rule:g.rule,menfeng:1,lizhi:1}));a.equal(h.fu,40);a(!h.hupai.some(y=>y.name==='平和'));
});
test('ordinary four-player rules retain an unvalued north outside north seat/round',()=>{
 const h=E.M.Shoupai.fromString('p123s45678z22,z444-');a.equal(E.M.Util.hule(h,'s9+',E.M.Util.hule_param({menfeng:1,zhuangfeng:0})).hupai,undefined);
});
