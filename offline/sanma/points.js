'use strict';
function payments(han,fu,yakuman,seat,honba,c){
 const base=yakuman?8000*yakuman:han>=13?8000:han>=11?6000:han>=8?4000:han>=6?3000:han>=5?2000:Math.min(2000,(fu||30)*2**(han+2)),ceil=n=>Math.ceil(n/100)*100,ronPoints=ceil(base*(seat===0?6:4));
 const child=(c.tsumo==='split'?ceil(ronPoints/2):ceil(base*(seat===0?2:1)))+honba*c.honbaEach,dealer=(c.tsumo==='split'?ceil(ronPoints/2):ceil(base*2))+honba*c.honbaEach;
 const label=yakuman?(yakuman===2?'ダブル役満':'役満'):han>=13?'数え役満':han>=11?'三倍満':han>=8?'倍満':han>=6?'跳満':base===2000?'満貫':han+'翻'+fu+'符';
 return {base,label,tier:0,ron:ronPoints+honba*c.honbaRon,child,dealer};
}
module.exports=function(E){
 const {M,J}=E,C=require('./custom'),T=C.Tiles,normal=t=>M.Shoupai.normal_pai(t).slice(0,2);
 const before=t=>{const s=t[0],n=+t[1];return s+(s!=='z'?(n===1?9:n-1):n<=4?(n===1?4:n-1):(n===5?7:n-1));};
 function score(args){
  const {hand,ron=null,seat=1,rule:baseRule,indicators=[],ura=[],north=0,extractedTiles=null,ippatsu=false,rinshan=false,last=false,honba=0,qianggang=false,tianhu=0,roundWind=0,customSanma,pocchiPhysical=null,pointsBefore=0,jewelChoice}=args,c=C.validate(customSanma),rule=J.effectiveRule({...baseRule,jewelIndicators:indicators},indicators,hand.lizhi?ura:[]);
  if(!ron&&!pocchiPhysical&&J.wildcard(rule,hand)){
   const base=hand.clone().dapai(hand._zimo);let best=null,bestValue=-Infinity;
   for(const suit of ['m','p','s','z'])for(let n=1;n<=(suit==='z'?7:9);n++){const tile=suit+n;if(!T.playable(c,tile)||base._bingpai[suit][n]>=4)continue;const r=score({...args,hand:base.clone().zimo(tile),pocchiPhysical:hand});if(!r)continue;const v=(ron?r.pay.ron:seat===0?r.pay.child*2:r.pay.child+r.pay.dealer)*10000+r.lines.reduce((n,l)=>n+l.amount,0)*(r.chipMultiplier||1);if(v>bestValue){best={...r,white:true,pocchi:hand._zimo,pocchiAs:tile,pocchiName:J.gemsFor(rule,hand._zimo).map(g=>g.name).join('＋'),chipMultiplier:(r.chipMultiplier||1)*(rule.gemTiles?.[hand._zimo]?.pocchiType==='double'?2:1)};bestValue=v;}}return best;
  }
  const logical=ron?hand.clone().zimo(ron.slice(0,2)):hand,physical=pocchiPhysical||logical,raw=J.rawTiles(physical.toString()),tiles=raw.map(normal),logicalTiles=J.rawTiles(logical.toString()).map(normal);
  if(logicalTiles.some(t=>!T.playable(c,t)))return null;
  const hidden=hand.lizhi&&(hand.menqian||J.has(rule,hand,'turquoise'))?ura:[],visible=indicators.map(t=>T.nextDora(c,t)).filter(Boolean).map(before),hiddenMapped=hidden.map(t=>T.nextDora(c,t)).filter(Boolean).map(before);
  const r=M.Util.hule(hand,ron,M.Util.hule_param({rule,menfeng:seat,zhuangfeng:roundWind,lizhi:hand.lizhi?1:0,yifa:ippatsu,lingshang:rinshan,qianggang,tianhu,haidi:last&&!rinshan?(ron?2:1):0,baopai:visible,fubaopai:hiddenMapped,jewelIndicators:indicators,jewelChoice,pocchi:pocchiPhysical?physical._zimo:undefined}));
  if(!r?.hupai?.length)return null;
  const yaku=r.hupai.map(y=>({...y})),extracted=extractedTiles?.length?extractedTiles:Array(north).fill('z4'),all=indicators.concat(hidden),nuki=extracted.reduce((sum,t)=>sum+(T.settings(c,normal(t)).nukiDora?1:0)+all.filter(i=>T.nextDora(c,i)===normal(t)).length+(rule.gemTiles?.[t]?.han||0),0),fixed=logicalTiles.filter(t=>T.settings(c,t).handDora).length;
  let han=r.fanshu||0;if(!r.damanguan){if(nuki){han+=nuki;yaku.push({name:'抜きドラ',fanshu:nuki});}if(fixed){han+=fixed;yaku.push({name:'設定ドラ',fanshu:fixed});}}
  const pearls=J.owned(rule,physical).filter(g=>g.effect==='pearl').length,pearlExtra=(nuki+fixed)*(2**pearls-1);if(pearlExtra&&!r.damanguan){han+=pearlExtra;yaku.push({name:'パール追加翻数倍',fanshu:pearlExtra});}
  const lines=require('../tile-chips').breakdown(c.tileChips,tiles.concat(extracted.map(normal)));let chipMultiplier=1;
  if(c.gemSelection.length||c.specialTiles.length){const h={...r,hupai:yaku,fanshu:han,shoupai:physical.toString(),baojia:ron?0:null,indicators,fubaopai:hidden,garnetUra:hidden,winningTile:normal(ron||hand._zimo),pocchiAs:pocchiPhysical?normal(hand._zimo):undefined};const b=J.bonusBreakdown(h,pointsBefore,null,rule);lines.push(...b.lines);chipMultiplier=b.multiplier;for(const t of extracted){const g=rule.gemTiles?.[t];if(g?.chips)lines.push({label:g.name+'（抜き牌）',amount:g.chips});}}
  return {...r,han,fanshu:r.damanguan?undefined:han,hupai:yaku,yaku,pay:payments(han,r.fu,r.damanguan,seat,honba,c),lines,chipMultiplier,eff:[0,0,0,0],tiles,physical:physical.toString(),white:!!pocchiPhysical,diceEligible:false,allFlowers:false,fourNorth:false,allStar:false,override:0,allPayBonus:0,extractedTiles:extracted.slice()};
 }
 return score;
};
module.exports.payments=payments;
