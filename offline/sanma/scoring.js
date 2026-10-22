'use strict';
module.exports=function(E){
 const {M,J}=E,normal=t=>M.Shoupai.normal_pai(t).slice(0,2),FLOWERS=['春','夏','秋','冬'];
 const POCCHI={normal:'z0',reverse:'zA',double:'zB',reverseDouble:'zC'},POCCHI_NAMES={normal:'白ポッチ',reverse:'逆ポッチ',double:'倍ポッチ',reverseDouble:'逆倍ポッチ'};
 const DEFAULT_FLOWERS={spring:'linked',summer:'rank',autumn:'dora',winter:'alice'};
 const VARIANTS={spring:['linked','fixed','tulip','off'],summer:['rank','han','off'],autumn:['dora','double','chips','off'],winter:['alice','tulip','dice','chips','off']};
 function options(extra={}){const flowerRules={...DEFAULT_FLOWERS,...extra.flowerRules};for(const [k,values]of Object.entries(VARIANTS))if(!values.includes(flowerRules[k]))throw Error('華の設定が不正です');if(extra.flowerCopies!==undefined&&![1,2].includes(extra.flowerCopies))throw Error('華は4枚または8枚です');if(extra.pocchiType&&!['normal','reverse','double','reverseDouble'].includes(extra.pocchiType))throw Error('ポッチの設定が不正です');const pocchiTypes=extra.pocchiTypes??(extra.whitePocchi===false?[]:[extra.pocchiType||'normal']);if(!Array.isArray(pocchiTypes)||pocchiTypes.length>4||new Set(pocchiTypes).size!==pocchiTypes.length||pocchiTypes.some(t=>!POCCHI[t]))throw Error('ポッチは各種類1枚・合計4枚までです');return {pocchiTypes,flowerCopies:1,whitePocchi:true,pocchiType:'normal',pocchiIppatsuDice:false,...extra,flowerRules};}
 function rule(){const gemTiles={};for(const s of ['p','s'])for(const [ch,color,chips]of [['0','金',1],['A','赤',0]])gemTiles[s+ch]={id:'sanma-'+s+ch,name:color+'5'+s,base:s+'5',han:1,effect:'fixed',chips,pocchi:false};gemTiles.z0={id:'topaz',name:'白ポッチ',base:'z5',han:0,effect:'fixed',chips:0,pocchi:true};return M.rule({'配給原点':35000,'赤牌':{m:0,p:0,s:0},'切り上げ満貫あり':true,'役満の複合あり':false,'ダブル役満あり':false,'数え役満あり':true,'場風牌':[1],'ツモ番なしリーチあり':true,'リーチ後暗槓許可レベル':2,gemTiles,gemSelection:[],jewelBonus:false,fullJewel:false});}
 function makeWall(o,rng=Math.random){const a=[];for(const s of ['m','p','s','z'])for(let n=1;n<=(s==='z'?7:9);n++){if(s==='m'&&n!==1&&n!==9)continue;for(let i=0;i<4;i++)a.push(s+((s==='p'||s==='s')&&n===5?(i<2?'0':'A'):s==='z'&&n===5&&i<o.pocchiTypes.length?POCCHI[o.pocchiTypes[i]][1]:n));}for(let f=1;f<=4;f++)for(let i=0;i<o.flowerCopies;i++)a.push('f'+f);for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function counts(hand){return J.rawTiles(hand.toString()).map(normal);}
 function sevenPairs(hand){if(hand._fulou.length)return false;const a=counts(hand),c={};for(const t of a)c[t]=(c[t]||0)+1;return a.length===14&&Object.values(c).every(n=>n%2===0);}
 function shanten(hand){if(hand._fulou.length)return M.Util.xiangting(hand);let pairs=0;for(const s of ['m','p','s','z'])for(let n=1;n<=(s==='z'?7:9);n++)pairs+=Math.floor((hand._bingpai[s][n]||0)/2);return Math.min(M.Util.xiangting(hand),6-pairs);}
 function waits(hand){if(hand._zimo)return [];const n=shanten(hand),out=[];for(const s of ['m','p','s','z'])for(let i=1;i<=(s==='z'?7:9);i++){if(s==='m'&&i!==1&&i!==9||hand._bingpai[s][i]>=4)continue;if(shanten(hand.clone().zimo(s+i))<n)out.push(s+i);}return out;}
 function indicator(t){if(t[0]==='f')return null;return normal(t)==='m1'?'m8':normal(t);}
 function dora(t){return t[0]==='f'?null:M.Shan.zhenbaopai(indicator(t));}
 function springDelta(before,after,o){if(['off','tulip'].includes(o.flowerRules.spring))return 0;if(o.flowerRules.spring==='fixed')return after.length-before.length;return after.filter(t=>t==='f1').length*after.length-before.filter(t=>t==='f1').length*before.length;}
 function effects(flowers,indicators){return [1,2,3,4].map(n=>flowers.filter(t=>t==='f'+n).length+indicators.filter(t=>t==='f'+n).length);}
 function payments(han,yakuman,summer,dealer,tsumo,honba=0){let base,tier;
  if(yakuman){base=8000;tier=7;}else if(han>=14){base=8000;tier=7;}else if(han>=11){base=6000;tier=6;}else if(han>=8){base=4000;tier=5;}else if(han>=6){base=3000;tier=4;}else if(han>=4){base=2000;tier=3;}else {tier=Math.max(0,han-1);base=30*2**(han+2);}
  const tiers=[240,480,960,2000,3000,4000,6000,8000,10000];tier=Math.min(8,tier+summer);if(summer)base=tiers[tier];const round=n=>Math.ceil(n/1000)*1000;
  return {tier,base,label:['1翻','2翻','3翻','満貫','跳満','倍満','三倍満',yakuman?'役満':'数え役満','5倍満'][tier],ron:round(base*(dealer?6:4))+honba*1000,child:round(base*(dealer?3:1.5))+honba*1000,dealer:round(base*(dealer?3:2.5))+honba*1000};
 }
 function score({hand,ron=null,seat=1,rule:gameRule=rule(),indicators=[],ura=[],north=0,flowers=[],flowerRules=DEFAULT_FLOWERS,ippatsu=false,rinshan=false,last=false,honba=0,qianggang=false,openRiichi=false,tianhu=0}){
  // Evaluate wildcard candidates with sanma's own seven-pairs and flower scoring too.
  if(!ron&&hand.lizhi&&Object.values(POCCHI).includes(hand._zimo)){
   const base=hand.clone().dapai(hand._zimo);let best=null,bestValue=-Infinity,bestChips=-Infinity;
   for(const t of waits(base)){const r=score({...arguments[0],hand:base.clone().zimo(t)});if(!r)continue;const value=seat===0?r.pay.child*2:r.pay.child+r.pay.dealer,chips=r.lines.reduce((n,l)=>n+l.amount,0);if(value>bestValue||value===bestValue&&chips>bestChips){best={...r,pocchiAs:t,pocchi:hand._zimo,white:true,diceEligible:true,physical:hand.toString()};bestValue=value;bestChips=chips;}}
   return best;
  }
  const physical=ron?hand.clone().zimo(ron.slice(0,2)):hand,eff=effects(flowers,indicators),baopai=indicators.map(indicator).filter(Boolean),fubaopai=hand.lizhi?ura.map(indicator).filter(Boolean):[];
  let r=M.Util.hule(hand,ron,M.Util.hule_param({rule:gameRule,menfeng:seat,zhuangfeng:0,lizhi:hand.lizhi?1:0,yifa:ippatsu,lingshang:rinshan,qianggang,tianhu,haidi:last&&!rinshan?(ron?2:1):0,baopai,fubaopai}));
  if(sevenPairs(physical)){
   const a=counts(physical),suits=new Set(a.map(t=>t[0])),ys=[{name:'七対子',fanshu:2}];if(hand.lizhi)ys.push({name:'立直',fanshu:1});if(!ron)ys.push({name:'門前清自摸和',fanshu:1});if(ippatsu)ys.push({name:'一発',fanshu:1});if(qianggang)ys.push({name:'槍槓',fanshu:1});if(tianhu)ys.push({name:tianhu===1?'天和':'地和',fanshu:'*'});if(a.every(t=>t[0]==='z'))ys.push({name:'字一色',fanshu:'*'});if(a.every(t=>['s2','s3','s4','s6','s8','z6'].includes(t)))ys.push({name:'緑一色',fanshu:'*'});if(a.every(t=>t[0]!=='z'&&/[19]/.test(t[1])))ys.push({name:'清老頭',fanshu:'*'});if(last)ys.push({name:ron?'河底撈魚':'海底摸月',fanshu:1});if(a.every(t=>t[0]!=='z'&&!/[19]/.test(t[1])))ys.push({name:'断幺九',fanshu:1});if(a.every(t=>t[0]==='z'||/[19]/.test(t[1])))ys.push({name:'混老頭',fanshu:2});if(suits.size===1&&!suits.has('z'))ys.push({name:'大車輪',fanshu:'*'});else if(suits.size===2&&suits.has('z'))ys.push({name:'混一色',fanshu:3});const red=J.rawTiles(physical.toString()).filter(t=>/[ps][0A]/.test(t)).length;if(red)ys.push({name:'赤・金ドラ',fanshu:red});for(const [name,ds]of [['ドラ',indicators],['裏ドラ',hand.lizhi?ura:[]]]){const n=ds.reduce((n,i)=>n+a.filter(t=>t===dora(i)).length,0);if(n)ys.push({name,fanshu:n});}const yakuman=ys.some(y=>y.fanshu==='*'),fan=ys.reduce((n,y)=>n+(typeof y.fanshu==='number'?y.fanshu:0),0);if(!r?.hupai||yakuman&&!r.damanguan||!r.damanguan&&fan>(r.fanshu||0))r={hupai:yakuman?ys.filter(y=>y.fanshu==='*'):ys,fanshu:yakuman?undefined:fan,damanguan:yakuman?1:undefined,fu:30};
  }
  if(!r?.hupai?.length)return null;
  // North may only remain in kokushi or the four-winds yakuman hands.
  if(counts(physical).includes('z4')&&!r.hupai.some(y=>/国士無双|四喜/.test(y.name)))return null;
  const a=counts(physical);if(r.pocchiAs){const i=a.indexOf('z5');if(i>=0)a[i]=r.pocchiAs;}
  let han=r.fanshu||0;const yaku=r.hupai.map(y=>({...y,name:openRiichi&&y.name==='立直'?'オープンリーチ':y.name}));
  for(const y of yaku){if(y.name==='混全帯幺九'){han+=4-Number(y.fanshu);y.fanshu=4;}if(y.name==='純全帯幺九'){han+=6-Number(y.fanshu);y.fanshu=6;}}
  if(yaku.some(y=>y.name==='混一色')&&a.every(t=>t[0]==='m'||t[0]==='z')){r={...r,damanguan:1};yaku.splice(0,yaku.length,{name:'萬子混一色',fanshu:'*'});}
  const nuki=north*(1+indicators.filter(i=>dora(i)==='z4').length+(hand.lizhi?ura.filter(i=>dora(i)==='z4').length:0));if(nuki){han+=nuki;yaku.push({name:'抜きドラ',fanshu:nuki});}
  const extraUra=north*(hand.lizhi?ura.filter(i=>dora(i)==='z4').length:0);
  if(eff[2]&&flowerRules.autumn==='dora'){const n=a.filter(t=>/[ps]5/.test(t)).length*eff[2];han+=n;if(n)yaku.push({name:'秋ドラ',fanshu:n});}
  if(eff[1]&&flowerRules.summer==='han'){han+=eff[1];yaku.push({name:'夏の加翻',fanshu:eff[1]});}
  if(eff[2]&&flowerRules.autumn==='double'){const fives=a.filter(t=>/[ps]5/.test(t));const n=fives.length+fives.reduce((n,t)=>n+indicators.concat(hand.lizhi?ura:[]).filter(i=>dora(i)===t).length,0);han+=n;if(n)yaku.push({name:'秋・5筒5索ドラ倍増',fanshu:n});}
  const pay=payments(han,!!r.damanguan,flowerRules.summer==='rank'?eff[1]:0,seat===0,!ron,honba),lines=[];const add=(label,amount)=>{if(amount)lines.push({label,amount});};
  add('一発',ippatsu?1:0);add('裏ドラ',extraUra+yaku.filter(y=>y.name==='裏ドラ').reduce((n,y)=>n+Number(y.fanshu),0));add('抜き北',north);const gold=J.rawTiles(physical.toString()).filter(t=>t==='p0'||t==='s0').length;add('金牌',gold*(eff[2]&&flowerRules.autumn==='double'?2:1));add('春の表示牌',['off','tulip'].includes(flowerRules.spring)?0:indicators.filter(t=>t==='f1').length*5);if(flowerRules.autumn==='chips')add('秋の祝儀',eff[2]);if(flowerRules.winter==='chips')add('冬の祝儀',eff[3]*2);
  if(r.damanguan)add('本役満',ron?20:10);else if(pay.tier===8)add('5倍満',10);else if(pay.tier===7)add('数え役満',5);else if(pay.tier===6)add('三倍満',3);
  const white=!!r.pocchiAs&&Object.values(POCCHI).includes(hand._zimo)&&hand.lizhi,allFlowers=[1,2,3,4].every(n=>flowers.includes('f'+n)||indicators.includes('f'+n)),fourNorth=north+indicators.filter(t=>normal(t)==='z4').length>=4;
  return {...r,fu:30,han,yaku,pay,lines,eff,tiles:a,physical:physical.toString(),white,extraUra,gold,allFlowers,fourNorth,diceEligible:!!r.damanguan||pay.tier===8||fourNorth||allFlowers||gold===4||last||white,override:north===4&&flowers.length===8?200:flowers.length===8||fourNorth&&allFlowers?100:0};
 }
 function alice({tiles,wall,mode='alice',open=false,winter=1,guarantee=0}){const reveals=[];let chips=0,index=0,safety=guarantee;const tulip=mode==='tulip'||winter>=2,width=mode==='tulip'&&winter>=2?2:1,mult=tulip?1:open?1:2;
  function hit(p){if(p[0]==='f')return 0;const t=normal(p),choices=[t];if(tulip){const s=t[0],n=+t[1];if(s==='z'){const lo=n<5?1:5,hi=n<5?4:7;choices.push(s+(n===lo?hi:n-1),s+(n===hi?lo:n+1));}else if(s==='m')choices.push('m'+(n===1?9:1));else choices.push(s+(n===1?9:n-1),s+(n===9?1:n+1));}return tiles.filter(t=>choices.includes(t)).length;}
  while(index+width<=wall.length){const group=wall.slice(index,index+width);index+=width;const hits=group.reduce((n,t)=>n+hit(t),0);reveals.push({tiles:group,hits});chips+=hits*mult;if(!hits){if(safety)safety--;else break;}}
  return {chips,reveals,mode:tulip?'チューリップ':'アリス',multiplier:mult};
 }
 function oneDie(rng=Math.random){const n=1+Math.floor(rng()*6);return {chips:n,rolls:[[n]]};}
 function twoDice(rng=Math.random){const rolls=[[1+Math.floor(rng()*6),1+Math.floor(rng()*6)]];return {chips:rolls[0][0]+rolls[0][1],rolls};}
 function dice(rng=Math.random){const rolls=[];let chips=0;for(let i=0;i<100;i++){const a=1+Math.floor(rng()*6),b=1+Math.floor(rng()*6),n=a===1&&b===1?20:a+b;rolls.push([a,b]);chips+=n;if(a!==b)break;}return {chips,rolls};}
 return {FLOWERS,POCCHI,POCCHI_NAMES,DEFAULT_FLOWERS,VARIANTS,options,rule,makeWall,normal,counts,shanten,waits,sevenPairs,springDelta,effects,payments,score,alice,dice,oneDie,twoDice,dora};
};
