'use strict';
// DAN wall, point limits, color inheritance and selectable custom rule preset.
const COLORS=Object.freeze({black:0,red:1,gold:2,platinum:3});
const POCCHI=Object.freeze(['normal','double']);
const SPEC=Object.freeze({
 id:'dan',name:'オススメ黒船風ルール',version:1,startingPoints:35000,rankOnly:true,
 firstChips:10,thirdChips:-10,secondThreshold:40000,secondBelowChips:-3,
 topThreshold:80000,topAllChips:2,honbaRon:2000,bustAtZero:true,bustAllChips:2,
 countedYakuman:13,fiveMangan:16,riichiPoints:5000,riichiChipDeposit:2,
 additionalVisible:2,additionalHidden:2
});
function integer(n,label){if(!Number.isSafeInteger(n))throw Error(label+'は整数です');return n;}
function base(value){
 if(typeof value!=='string'||!/^(?:m[159]|[ps][1-9]|z[1-7])$/.test(value))throw Error('黒船風ルールの牌種が不正です');
 return value;
}
function tile(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('牌の設定が不正です');
 const b=base(value.base),color=value.color??'black',pocchi=value.pocchi??null;
 if(!Object.hasOwn(COLORS,color))throw Error('色牌の設定が不正です');
 if(pocchi!==null&&(!POCCHI.includes(pocchi)||b!=='z5'))throw Error('ポッチの設定が不正です');
 if(b[0]==='z'&&color!=='black')throw Error('字牌に色は設定できません');
 return {base:b,color,pocchi,extracted:b==='m5'};
}
function wall(){
 const tiles=[];
 for(const s of ['m','p','s','z'])for(let n=1;n<=(s==='z'?7:9);n++){
  if(s==='m'&&![1,5,9].includes(n))continue;
  const colors=n===5&&s!=='z'?['platinum','gold','red','black']:['p','s'].includes(s)&&[3,7].includes(n)?['gold','red','black','black']:['black','black','black','black'];
  for(let i=0;i<4;i++)tiles.push(tile({base:s+n,color:colors[i],pocchi:s==='z'&&n===5&&i<2?POCCHI[i]:null}));
 }
 return tiles;
}
function rankSettlement(points,{initialDealer=0}={}){
 if(!Array.isArray(points)||points.length!==3)throw Error('3人分の持ち点が必要です');
 points.forEach(n=>integer(n,'持ち点'));if(![0,1,2].includes(initialDealer))throw Error('起家が不正です');
 const order=[0,1,2].sort((a,b)=>points[b]-points[a]||(a-initialDealer+3)%3-(b-initialDealer+3)%3),[first,second,third]=order;
 const ledger=[{from:third,to:first,amount:10,label:'順位祝儀'}];
 if(points[second]<SPEC.secondThreshold)ledger.push({from:second,to:first,amount:3,label:'2着4万点未満'});
 if(points[first]>=SPEC.topThreshold)for(const from of [second,third])ledger.push({from,to:first,amount:2,label:'8万点以上トップ'});
 const delta=[0,0,0];for(const t of ledger){delta[t.from]-=t.amount;delta[t.to]+=t.amount;}
 return {order,ledger,delta,results:order.map((id,index)=>({id,rank:index+1,points:points[id],rankChips:delta[id],score:0}))};
}
function limit(han,yakuman=0){
 integer(han,'翻数');integer(yakuman,'役満数');if(han<0||yakuman<0)throw Error('翻数・役満数が不正です');
 if(yakuman)return {base:8000*yakuman,label:yakuman===1?'役満':yakuman+'倍役満',counted:false};
 if(han>=16)return {base:10000,label:'5倍満',counted:true};
 if(han>=13)return {base:8000,label:'数え役満',counted:true};
 if(han>=11)return {base:6000,label:'三倍満',counted:false};
 if(han>=8)return {base:4000,label:'倍満',counted:false};
 if(han>=6)return {base:3000,label:'跳満',counted:false};
 if(han>=4)return {base:2000,label:'満貫',counted:false};
 return {base:30*2**(han+2),label:han+'翻',counted:false};
}
function nextDora(b){
 base(b);const s=b[0],n=+b[1];
 if(s==='m')return n===9?'m1':'m9';
 if(s==='z')return s+(n<5?n%4+1:(n-4)%3+5);
 return s+(n%9+1);
}
function visibleEffect(indicator){
 const t=tile(indicator);
 if(t.pocchi)return {target:'z5',pocchi:t.pocchi,color:null};
 return {target:nextDora(t.base),color:t.color==='black'?null:t.color,pocchi:null};
}
function hiddenChoice(indicator,choice){
 const t=tile(indicator);
 if(!t.pocchi)throw Error('任意の裏ドラを選べるのはポッチ表示だけです');
 const selected=tile(choice);
 if(selected.pocchi||t.pocchi==='normal'&&selected.color!=='black')throw Error('通常白ポッチの裏表示では通常ドラを選んでください');
 return {target:selected.base,color:t.pocchi==='double'&&selected.color!=='black'?selected.color:null,pocchi:null};
}
module.exports={SPEC,COLORS,POCCHI,tile,wall,rankSettlement,limit,nextDora,visibleEffect,hiddenChoice};

function profile(){const C=require('./custom'),specialTiles=[];for(const b of ['m5','p5','s5'])for(const [slot,color]of ['platinum','gold','red'].entries())specialTiles.push({base:b,slot,name:({platinum:'プラチナ',gold:'金',red:'赤'})[color]+require('../tile-chips').label(b),han:1,chips:COLORS[color],color:({platinum:'#b4b8ea',gold:'#e8b72c',red:'#e34b59'})[color],danColor:color});for(const b of ['p3','p7','s3','s7'])for(const [slot,color]of ['gold','red'].entries())specialTiles.push({base:b,slot,name:(color==='gold'?'金':'赤')+require('../tile-chips').label(b),han:1,chips:COLORS[color],color:color==='gold'?'#e8b72c':'#e34b59',danColor:color});for(const [slot,pocchi]of ['normal','double'].entries())specialTiles.push({base:'z5',slot,name:pocchi==='double'?'倍ポッチ':'白ポッチ',han:0,chips:0,color:pocchi==='double'?'#cf8bd7':'#a0c9df',pocchi});return C.validate({version:1,name:'オススメ黒船風ルール',scoring:'dan',length:'east',startPoints:35000,returnPoints:35000,settlement:'rank',uma:[10,0,-10],honbaRon:2000,honbaEach:1000,notenPool:2000,bustAtZero:true,nuki:false,specialTiles,tileRules:C.Tiles.tileRules(undefined,false).map(r=>({...r,...(r.tile==='m5'?{included:true,hand:false,extract:true,nukiDora:true}:{}),...(r.tile==='z4'?{extract:false,nukiDora:false}:{})}))});}
function descriptor(token,rule){const S=require('../../vendor/majiang-core/lib/shoupai'),g=require('../jewels').gemsFor(rule,token)[0];return {base:S.normal_pai(token).slice(0,2),color:g?.danColor||'black',pocchi:S.normal_pai(token).slice(0,2)==='z5'?(g?.pocchiType||(g?.pocchi?'normal':null)):null};}
function hiddenOptions(indicator,custom){const C=require('./custom'),items=[];for(const suit of ['m','p','s','z'])for(let n=1;n<=(suit==='z'?7:9);n++){const base=suit+n;if(!C.Tiles.settings(custom,base).included)continue;for(const color of indicator.pocchi==='double'&&suit!=='z'?['black','red','gold','platinum']:['black'])items.push({base,color});}return items;}
function score(E,args,baseScore){
 const {hand,ron=null,seat=1,rule:baseRule,indicators=[],ura=[],extractedTiles=[],customSanma,danChoices=[],pointsBefore=0,honba=0,danPocchiPhysical=null}=args,J=E.J,M=E.M,C=require('./custom'),rule=J.effectiveRule({...baseRule,jewelIndicators:indicators},indicators,hand.lizhi?ura:[]),hidden=hand.lizhi&&(hand.menqian||J.has(rule,hand,'turquoise'))?ura:[];
 const visibleEffects=indicators.map(t=>visibleEffect(descriptor(t,rule))),hiddenEffects=hidden.map((t,i)=>{const d=descriptor(t,rule);return d.pocchi?hiddenChoice(d,danChoices[i]||hiddenOptions(d,customSanma)[0]):{target:nextDora(d.base),color:d.color==='black'?null:d.color,pocchi:null};}),effects=visibleEffects.concat(hiddenEffects),drawn=hand._zimo,drawDescriptor=drawn?descriptor(drawn,rule):null,whiteEffect=drawDescriptor?.base==='z5'?visibleEffects.filter(e=>e.pocchi).at(-1):null,pocchi=drawDescriptor?.pocchi||whiteEffect?.pocchi;
 if(!ron&&!danPocchiPhysical&&(hand.lizhi&&pocchi||J.wildcard(rule,hand))){const ready=hand.clone().dapai(drawn);let best=null,value=-Infinity;for(const suit of ['m','p','s','z'])for(let n=1;n<=(suit==='z'?7:9);n++){const tile=suit+n;if(!C.Tiles.playable(customSanma,tile)||ready._bingpai[suit][n]>=4)continue;const r=score(E,{...args,hand:ready.clone().zimo(tile),danPocchiPhysical:hand},baseScore);if(!r)continue;const v=(ron?r.pay.ron:seat===0?r.pay.child*2:r.pay.child+r.pay.dealer)*10000+r.lines.reduce((n,l)=>n+l.amount,0)*(pocchi==='double'?2:1);if(v>value){value=v;best={...r,white:true,pocchi:drawn,pocchiAs:tile,danPocchiType:pocchi,pocchiName:rule.gemTiles?.[drawn]?.name||(pocchi==='double'?'倍ポッチ':'白ポッチ'),chipMultiplier:(r.chipMultiplier||1)*(pocchi==='double'?2:1)};}}return best;}
 const logical=ron?hand.clone().zimo(ron.slice(0,2)):hand,physical=danPocchiPhysical||logical,raw=J.rawTiles(physical.toString()),tiles=J.rawTiles(logical.toString()).map(t=>M.Shoupai.normal_pai(t).slice(0,2));if(tiles.some(t=>!C.Tiles.playable(customSanma,t))||M.Util.xiangting(logical)!==-1)return null;
 // Core sanma handles the local yaku; colored indicators are scored below.
 const base=baseScore({...args,hand,indicators:[],ura:[],north:0,flowers:[],customSanma:null,danMode:true,jewelIndicators:indicators,rule:{...rule,jewelIndicators:[]}});if(!base)return null;
 let yaku=base.yaku.filter(y=>!['ドラ','裏ドラ','抜きドラ','赤・金ドラ'].includes(y.name)).map(y=>({...y})),han=yaku.reduce((n,y)=>n+(typeof y.fanshu==='number'?y.fanshu:0),0);const allTiles=raw.concat(extractedTiles),lines=[];
 function add(label,amount){if(amount)lines.push({label,amount});}
 for(const [name,list]of [['ドラ',visibleEffects],['裏ドラ',hiddenEffects]]){const n=list.filter(e=>!e.pocchi).reduce((sum,e)=>sum+tiles.filter(t=>t===e.target).length+extractedTiles.filter(t=>M.Shoupai.normal_pai(t).slice(0,2)===e.target).length,0);if(n){han+=n;yaku.push({name,fanshu:n});}if(name==='裏ドラ')add('裏ドラ',n);}
 let inheritedHan=0;for(const [index,t]of allTiles.entries()){const instant=index>=raw.length&&customSanma.danExtractTiming==='instant',d=descriptor(t,rule),own=COLORS[d.color],color=Math.max(own,...effects.filter(e=>e.target===d.base&&e.color).map(e=>COLORS[e.color]));if(color>own&&!own)inheritedHan++;const g=rule.gemTiles?.[t];if(color&&(!instant||color>own))add((color>own?'色ドラ：':'')+(['黒','赤','金','プラチナ'][color])+require('../tile-chips').label(d.base),color-(instant?own:0));else if(g?.chips&&!instant&&color===0&&(!customSanma.gemSelection.length||index>=raw.length))add(g.name,g.chips);}
 const nuki=extractedTiles.reduce((sum,t)=>sum+(C.Tiles.settings(customSanma,M.Shoupai.normal_pai(t).slice(0,2)).nukiDora?1:0)+(C.Tiles.settings(customSanma,M.Shoupai.normal_pai(t).slice(0,2)).nukiDora&&indicators.some(i=>descriptor(i,rule).base==='m5')&&M.Shoupai.normal_pai(t).slice(0,2)==='m5'?1:0)+(rule.gemTiles?.[t]?.han||0),0);if(nuki){han+=nuki;yaku.push({name:'抜きドラ',fanshu:nuki});}const fixed=tiles.filter(t=>C.Tiles.settings(customSanma,t).handDora).length;if(fixed){han+=fixed;yaku.push({name:'設定ドラ',fanshu:fixed});}if(inheritedHan){han+=inheritedHan;yaku.push({name:'色ドラの色加翻',fanshu:inheritedHan});}if(args.ippatsu)add('一発',1);
 const added=yaku.filter(y=>['ドラ','裏ドラ','抜きドラ','設定ドラ','色ドラの色加翻'].includes(y.name)).reduce((n,y)=>n+(+y.fanshu||0),0),pearls=J.owned(rule,physical).filter(g=>g.effect==='pearl').length,pearlExtra=added*(2**pearls-1);if(pearlExtra){han+=pearlExtra;yaku.push({name:'パール追加翻数倍',fanshu:pearlExtra});}let yakuman=base.damanguan||0;if(yakuman){yaku=yaku.filter(y=>typeof y.fanshu==='string');add('本役満',ron?20:10);}else if(han>=16)add('5倍満',10);else if(han>=13)add('数え役満',5);else if(han>=11)add('三倍満',3);
 lines.push(...require('../tile-chips').breakdown(customSanma.tileChips,raw.map(t=>M.Shoupai.normal_pai(t).slice(0,2)).concat(extractedTiles.map(t=>M.Shoupai.normal_pai(t).slice(0,2)))));
 const adjusted=han>=16?{han:14,summer:1}:han>=13?{han:14,summer:0}:{han,summer:0},pay=E.Sanma.payments(adjusted.han,yakuman,adjusted.summer,seat===0,!ron,honba,args.house);
 if(!yakuman&&han>=16)pay.label='5倍満';else if(!yakuman&&han>=13)pay.label='数え役満';
 let chipMultiplier=1;if(customSanma.gemSelection.length){const b=J.bonusBreakdown({...base,hupai:yaku,fanshu:han,shoupai:physical.toString(),baojia:ron?0:null,indicators,fubaopai:hidden,garnetUra:hidden,winningTile:M.Shoupai.normal_pai(ron||hand._zimo)},pointsBefore,null,rule);for(const l of b.lines)if(!['一発','裏ドラ','役満祝儀','数え役満祝儀','祝儀手役'].includes(l.label)&&!allTiles.some(t=>rule.gemTiles?.[t]?.danColor&&l.label===rule.gemTiles[t].name))lines.push(l);chipMultiplier=b.multiplier;}
 return {...base,han,fanshu:yakuman?undefined:han,hupai:yaku,yaku,fu:30,pay,lines,tiles,physical:physical.toString(),white:!!danPocchiPhysical,diceEligible:false,allFlowers:false,fourNorth:false,allStar:false,allPayBonus:0,override:0,chipMultiplier,eff:[0,0,0,0],danChoices:danChoices.slice()};
}
module.exports={...module.exports,profile,descriptor,hiddenOptions,score};
