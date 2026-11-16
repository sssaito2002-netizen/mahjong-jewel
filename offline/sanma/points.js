'use strict';
function payments(han,fu,yakuman,seat,honba,c){
 const base=yakuman?8000*yakuman:han>=13?8000:han>=11?6000:han>=8?4000:han>=6?3000:han>=5?2000:Math.min(2000,(fu||30)*2**(han+2)),ceil=n=>Math.ceil(n/100)*100,ronPoints=ceil(base*(seat===0?6:4));
 const child=(c.tsumo==='split'?ceil(ronPoints/2):ceil(base*(seat===0?2:1)))+honba*c.honbaEach,dealer=(c.tsumo==='split'?ceil(ronPoints/2):ceil(base*2))+honba*c.honbaEach;
 const label=yakuman?(yakuman===2?'ダブル役満':'役満'):han>=13?'数え役満':han>=11?'三倍満':han>=8?'倍満':han>=6?'跳満':base===2000?'満貫':han+'翻'+fu+'符';
 return {base,label,tier:0,ron:ronPoints+honba*c.honbaRon,child,dealer};
}
module.exports=function(E){
 const {M}=E,C=require('./custom'),normal=t=>M.Shoupai.normal_pai(t).slice(0,2);
 return function score({hand,ron=null,seat=1,rule,indicators=[],ura=[],north=0,ippatsu=false,rinshan=false,last=false,honba=0,qianggang=false,tianhu=0,roundWind=0,customSanma}){
  const c=C.validate(customSanma),visible=indicators.map(t=>normal(t)==='m1'?'m8':normal(t)),hidden=hand.lizhi&&hand.menqian?ura.map(t=>normal(t)==='m1'?'m8':normal(t)):[];
  const r=M.Util.hule(hand,ron,M.Util.hule_param({rule,menfeng:seat,zhuangfeng:roundWind,lizhi:hand.lizhi?1:0,yifa:ippatsu,lingshang:rinshan,qianggang,tianhu,haidi:last&&!rinshan?(ron?2:1):0,baopai:visible,fubaopai:hidden}));
  if(!r?.hupai?.length)return null;
  const yaku=r.hupai.map(y=>({...y})),all=visible.concat(hidden),nuki=north*(1+all.filter(i=>M.Shan.zhenbaopai(i)==='z4').length);
  let han=r.fanshu||0;if(nuki&&!r.damanguan){han+=nuki;yaku.push({name:'抜きドラ',fanshu:nuki});}
  const physical=(ron?hand.clone().zimo(ron.slice(0,2)):hand).toString(),tiles=E.J.rawTiles(physical).map(normal);
  return {...r,han,fanshu:r.damanguan?undefined:han,hupai:yaku,yaku,pay:payments(han,r.fu,r.damanguan,seat,honba,c),lines:require('../tile-chips').breakdown(c.tileChips,tiles,{north}),eff:[0,0,0,0],tiles,physical,white:false,diceEligible:false,allFlowers:false,fourNorth:false,allStar:false,override:0,allPayBonus:0};
 };
};
module.exports.payments=payments;
