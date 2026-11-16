'use strict';
// Source-confirmed building blocks. Not selectable until the exceptional
// all-seven interpretation and tulip settlement have been confirmed.
const SOURCE='https://note.com/backofatama/n/na1ee5d2c2827';
const ORPHANS=['p1','p7','p9','s1','s7','s9',...Array.from({length:7},(_,i)=>'z'+(i+1))];
function wall(){const out=[];for(const suit of ['p','s','z'])for(let n=1;n<=(suit==='z'?7:9);n++)for(let i=0;i<(suit!=='z'&&n===7?8:4);i++)out.push(suit+(suit!=='z'&&n===5&&i<2?'0':n));for(let i=1;i<=4;i++)out.push('f'+i);return out;}
const normal=t=>/[ps]0/.test(t)?t[0]+'5':t;
function counts(tiles){const c=new Map();for(const t of tiles.map(normal))c.set(t,(c.get(t)||0)+1);return c;}
function withinFour(tiles){return [...counts(tiles).values()].every(n=>n<=4);}
function sevenOrphans(tiles,{open=false}={}){if(open||tiles.length!==14)return false;const c=counts(tiles);return c.size===13&&ORPHANS.every(t=>c.has(t))&&[...c.values()].every(n=>n<=2);}
function allSeven(tiles,{open=false}={}){return !open&&tiles.length===14&&tiles.every(t=>['p7','s7'].includes(t));}
function allowedWait(tile,owned){return (counts(owned).get(normal(tile))||0)<4;}
function rank(points,{initialDealer=0}={}){
 if(!Array.isArray(points)||points.length!==3||points.some(n=>!Number.isSafeInteger(n))||![0,1,2].includes(initialDealer))throw Error('精算条件が不正です');
 const order=[0,1,2].sort((a,b)=>points[b]-points[a]||(a-initialDealer+3)%3-(b-initialDealer+3)%3),[first,second,last]=order;
 const transfers=[{from:last,to:first,amount:30}];if(points[second]>=30000)transfers.push({from:last,to:second,amount:10});else transfers.push({from:second,to:first,amount:10});
 const delta=[0,0,0];for(const t of transfers){delta[t.from]-=t.amount;delta[t.to]+=t.amount;}
 return {order,transfers,delta};
}
module.exports={SOURCE,ORPHANS,wall,withinFour,sevenOrphans,allSeven,allowedWait,rank};

function pairs(tiles,open=false){return !open&&tiles.length===14&&[...counts(tiles).values()].every(n=>n%2===0);}
function tulip({tiles,flowers=[],wall=[],riichi=false,yakuman=0,tianhu=false,ippatsu=false,han=0}){
 const count=counts(tiles),sevens=['p7','s7'].filter(t=>(count.get(t)||0)>=3).length,eligible=riichi||yakuman||tianhu;
 if(!eligible)return null;
 let stage=yakuman?(riichi||tianhu?sevens?2:1:0):sevens,stocks=(ippatsu?1:0)+(han>=11||yakuman?1:0),chips=0;
 const initialStage=stage,initialStocks=stocks,reveals=[];
 function hits(t){
  if(t[0]==='f')return flowers.length*3;
  const p=normal(t),s=p[0],n=+p[1],choices=[p];
  if(s==='z'){const lo=n<5?1:5,hi=n<5?4:7;choices.push(s+(n===lo?hi:n-1),s+(n===hi?lo:n+1));}
  else choices.push(s+(n===1?9:n-1),s+(n===9?1:n+1));
  return choices.reduce((sum,p)=>sum+(count.get(p)||0),0);
 }
 for(let i=0;i<wall.length;i+=2){
  const before=stage,group=wall.slice(i,i+(stage?2:1)),values=group.map(hits),total=values.reduce((a,b)=>a+b,0);
  for(let j=0;j<group.length;j++)if(group[j][0]!=='f'&&values[j]>=6)stage=Math.min(2,stage+1);
  const consumed=total===0&&stocks>0;if(consumed)stocks--;
  chips+=total;reveals.push({tiles:group,hits:total,perTile:values,stageBefore:before,stageAfter:stage,stockUsed:consumed,stocksLeft:stocks});
  if(!total&&!consumed)break;
 }
 return {chips,reveals,initialStage,finalStage:stage,initialStocks,multiplier:stage===2?2:1,mode:['通常','確変','16R'][stage]};
}
const pointFunctions=new WeakMap();
function score(E,args){
 const {hand,ron=null,seat=1,rule,indicators=[],ura=[],flowers=[],ippatsu=false,rinshan=false,last=false,honba=0,qianggang=false,tianhu=0,customSanma,bingoWall=null}=args,M=E.M;
 const physical=ron?hand.clone().zimo(ron.slice(0,2)):hand,raw=E.J.rawTiles(physical.toString()),tiles=raw.map(normal),open=physical._fulou.some(m=>/[+=-]/.test(m)),isAll=allSeven(tiles,{open:physical._fulou.length>0});
 if(!withinFour(tiles)&&!isAll)return null;
 if(!pointFunctions.has(E))pointFunctions.set(E,require('./points')(E));
 let r;if(isAll)r={damanguan:2,han:0,fu:0,yaku:[{name:'オールセブン',fanshu:'**'}]};
 else if(sevenOrphans(tiles,{open:physical._fulou.length>0}))r={damanguan:1,han:0,fu:0,yaku:[{name:'七士無双',fanshu:'*'}]};
 else r=pointFunctions.get(E)({...args,indicators:indicators.filter(t=>t[0]!=='f'),ura:ura.filter(t=>t[0]!=='f')});
 if(pairs(tiles,physical._fulou.length>0)){
  const ys=[{name:'七対子',fanshu:2}],suits=new Set(tiles.map(t=>t[0]));
  if(hand.lizhi)ys.push({name:'立直',fanshu:1});if(!ron)ys.push({name:'門前清自摸和',fanshu:1});if(ippatsu)ys.push({name:'一発',fanshu:1});
  if(tiles.every(t=>t[0]==='z'))ys.push({name:'字一色',fanshu:'*'});
  if(tiles.every(t=>t[0]!=='z'&&/[19]/.test(t[1])))ys.push({name:'清老頭',fanshu:'*'});
  if(tiles.every(t=>['s2','s3','s4','s6','s8','z6'].includes(t)))ys.push({name:'緑一色',fanshu:'*'});
  if(tianhu)ys.push({name:tianhu===1?'天和':'地和',fanshu:'*'});
  if(tiles.every(t=>t[0]==='z'||/[19]/.test(t[1])))ys.push({name:'混老頭',fanshu:2});
  if(tiles.every(t=>t[0]!=='z'&&!/[19]/.test(t[1])))ys.push({name:'断幺九',fanshu:1});
  if(suits.size===1&&!suits.has('z'))ys.push({name:'清一色',fanshu:6});else if(suits.size===2&&suits.has('z'))ys.push({name:'混一色',fanshu:3});
  const red=raw.filter(t=>/[ps]0/.test(t)).length;if(red)ys.push({name:'赤ドラ',fanshu:red});
  for(const [name,ds]of [['ドラ',indicators],['裏ドラ',hand.lizhi?ura:[]]]){const n=ds.filter(t=>t[0]!=='f').reduce((sum,i)=>sum+tiles.filter(t=>t===M.Shan.zhenbaopai(normal(i))).length,0);if(n)ys.push({name,fanshu:n});}
  const real=ys.filter(y=>typeof y.fanshu==='string'),fan=ys.reduce((n,y)=>n+(typeof y.fanshu==='number'?y.fanshu:0),0);
  if(!r||real.length&&!r.damanguan||!r.damanguan&&fan>(r.han||0))r={damanguan:real.length?1:0,han:fan,fu:25,yaku:real.length?real:ys};
 }
 if(!r)return null;
 const hidden=hand.lizhi&&hand.menqian?ura:[],extraFlower=flowers.length*(1+indicators.concat(hidden).filter(t=>t[0]==='f').length),han=(r.han||r.fanshu||0)+(r.damanguan?0:extraFlower),yaku=r.yaku||r.hupai;
 if(extraFlower&&!r.damanguan)yaku.push({name:'華ドラ',fanshu:extraFlower});
 const lines=[],red=raw.filter(t=>/[ps]0/.test(t)).length,uraCount=hidden.filter(t=>t[0]!=='f').reduce((sum,i)=>sum+tiles.filter(t=>t===M.Shan.zhenbaopai(normal(i))).length,0)+flowers.length*hidden.filter(t=>t[0]==='f').length;
 if(ippatsu)lines.push({label:'一発',amount:1});if(uraCount)lines.push({label:'裏ドラ',amount:uraCount});if(red)lines.push({label:'赤牌',amount:red});if(flowers.length)lines.push({label:'華牌',amount:flowers.length});
 if(r.damanguan)lines.push({label:'本役満',amount:(ron?20:10)*r.damanguan});else if(han>=13)lines.push({label:'数え役満',amount:ron?4:2});
 lines.push(...require('../tile-chips').breakdown(customSanma.tileChips,tiles));
 const bingoTulip=bingoWall?tulip({tiles,flowers,wall:bingoWall,riichi:!!hand.lizhi,yakuman:r.damanguan||0,tianhu,ippatsu,han}):null;
 if(bingoTulip?.chips)lines.push({label:'確変チューリップ',amount:bingoTulip.chips});
 return {...r,han,fanshu:r.damanguan?undefined:han,hupai:yaku,yaku,pay:require('./points').payments(han,r.fu,r.damanguan,seat,honba,customSanma),lines,eff:[0,0,0,0],tiles,physical:physical.toString(),white:false,diceEligible:false,allFlowers:false,fourNorth:false,override:0,allPayBonus:0,bingoTulip};
}
module.exports={...module.exports,pairs,tulip,score,counts,normal};
