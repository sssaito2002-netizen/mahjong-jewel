'use strict';
const SOURCES={initial:'https://note.com/menzenreach/n/ne611720a6e37',v2:'https://note.com/menzenreach/n/n29f9fdb978fd',v3:'https://note.com/menzenreach/n/nc00d9a47e5d7',v4:'https://note.com/menzenreach/n/n281285c5140e',v5:'https://note.com/menzenreach/n/ncbc49b792147',v6:'https://note.com/menzenreach/n/nb34690c45187'};
const rows=[
 ['emerald','エメラルド','m5',1,'fixed',3,'initial'],['lapis','ラピスラズリ','m5',2,'lapis',0,'v5'],
 ['ruby','ルビー','p5',1,'fixed',1,'initial'],['silver','シルバー','p5',2,'fixed',0,'initial'],
 ['gold','ゴールド','p5',2,'fixed',4,'v6'],['amethyst-p','アメジスト','p5',2,'amethyst',1,'v2'],
 ['pearl','パール','p5',0,'pearl',3,'v3'],['carnelian','カーネリアン','p5',0,'carnelian',0,'v2'],
 ['turquoise','ターコイズ','p5',0,'turquoise',4,'v4'],['black-diamond','ブラックダイヤ','p5',2,'black',0,'v4'],
 ['aquamarine','アクアマリン','s5',1,'fixed',2,'v5'],['garnet','ガーネット','s5',2,'garnet',0,'v4'],
 ['crystal','クリスタル','s5',2,'crystal',0,'v2'],['tourmaline','トルマリン','s5',2,'tourmaline',0,'v5'],
 ['amethyst-s','アメジスト','s5',2,'amethyst',1,'v6'],
 ['topaz','トパーズ白ポッチ','z5',0,'fixed',1,'initial'],['amethyst-white','アメジスト白ポッチ','z5',0,'amethyst',1,'v2'],
 ['gold-pocchi','ゴールド發ポッチ','z6',0,'fixed',4,'v3'],['gane-pocchi','ガネクリ北ポッチ','z4',0,'gane',0,'v6']
];
const CATALOG=rows.map(([id,name,base,han,effect,chips,source])=>({id,name,base,han,effect,chips,source:SOURCES[source],pocchi:base[0]==='z'}));
const BY_ID=Object.fromEntries(CATALOG.map(g=>[g.id,g]));
const DEFAULT=['lapis','amethyst-p','tourmaline','amethyst-white'];
function configure(ids){
 if(!Array.isArray(ids)||new Set(ids).size!==ids.length)throw Error('同じ宝石牌は1枚までです');
 const groups={},tiles={};for(const id of ids){const g=BY_ID[id];if(!g)throw Error('不明な宝石牌: '+id);(groups[g.base]||=[]).push(g);if(groups[g.base].length>2)throw Error(g.base+'に入る宝石牌は2種類までです');}
 for(const [base,gs] of Object.entries(groups))gs.forEach((g,i)=>{const token=base[0]+(base[0]==='z'?({4:'9',5:i?'A':'0',6:'8'}[base[1]]):i?'A':'0');tiles[token]={...g};});
 if(ids.filter(id=>BY_ID[id].pocchi).length>3)throw Error('ポッチは最大3種類です');
 return tiles;
}
function rawTiles(text){const out=[];for(const part of text.match(/[mpsz][0-9A]+/g)||[])for(const n of part.slice(1))out.push(part[0]+n);return out;}
function owned(rule,hand){return rawTiles(typeof hand==='string'?hand:hand.toString()).map(t=>rule.gemTiles?.[t]).filter(Boolean);}
function has(rule,hand,effect){return owned(rule,hand).some(g=>g.effect===effect);}
function wildcard(rule,hand){const g=rule.gemTiles?.[hand._zimo];return !!g?.pocchi && (g.id==='gold-pocchi'||hand.lizhi);}
function number(p){return p&&p[0]!=='z'?(p[1]==='0'||p[1]==='A'?5:+p[1]):0;}
function garnet(indicators=[],ura=[]){return Math.max(0,...indicators.map((p,i)=>number(p[0]==='z'?ura[i]:p)));}
function full(rule,items){const numbers=Object.values(rule.gemTiles||{}).filter(g=>!g.pocchi);return numbers.length>0&&numbers.every(g=>items.some(x=>x.id===g.id))&&new Set(items.filter(g=>g.pocchi).map(g=>g.id)).size>=2;}
function modifyHan(items,han,choice){const car=items.some(g=>g.effect==='carnelian');const mode=car&&(choice==='han'||han<=1)?'han':'chips';if(car)han+=mode==='han'?5:-1;const pearls=items.filter(g=>g.effect==='pearl').length;return {han:han*2**pearls,carnelianChoice:car?mode:null};}
function bonus(h,points,unlockedYaku,rule){
 const items=owned(rule,h.shoupai), count=e=>items.filter(g=>g.effect===e).length;
 const usual=(h.hupai||[]).filter(y=>['一発','裏ドラ'].includes(y.name)).reduce((n,y)=>n+(+y.fanshu||0),0);
 const winning=h.pocchiAs||h.winningTile;let total=usual;
 // Yakuman chips are charged per payer, just like all other chips.
 if(h.damanguan)total+=(h.baojia==null?10:20)*h.damanguan;
 else if(h.fanshu>=13)total+=h.baojia==null?5:10;
 if((h.hupai||[]).some(y=>y.name===unlockedYaku))total+=5;
 for(const g of items){if(['fixed','amethyst','pearl','turquoise'].includes(g.effect))total+=g.chips;
  else if(g.effect==='lapis')total+=h.fanshu||13;
  else if(g.effect==='tourmaline')total+=Math.max(0,...String(Math.floor(Math.max(0,points)/100)).slice(-3).split('').map(Number));
  else if(g.effect==='garnet')total+=garnet(h.indicators,h.garnetUra);
  else if(g.effect==='crystal')total+=number(winning);
  else if(g.effect==='gane')total+=Math.max(garnet(h.indicators,h.garnetUra),number(winning));
  else if(g.effect==='black')total+=h.blackChips||0;
  else if(g.effect==='carnelian')total+=h.carnelianChoice==='han'?-1:5;
 }
 if(items.some(g=>g.id==='gold')&&items.some(g=>g.id==='gold-pocchi')&&(!h.pocchiAs||h.pocchiAs==='z6'))total+=10;
 return total*2**count('amethyst');
}
function blackChips(tiles,mianzi){
 const outside=t=>t[0]==='z'||/[19]/.test(t[1]);const n=tiles.filter(outside).length;if(!n)return 5;
 let result=n;for(const m of mianzi){if(!outside(m.slice(0,2)))continue;if(/^[mpsz]([1-9])\1\1\1$/.test(m))result+=6;else if(/^[mpsz]([1-9])\1\1(?:_!)?$/.test(m))result+=2;}
 return result;
}
module.exports={SOURCES,CATALOG,BY_ID,DEFAULT,configure,rawTiles,owned,has,wildcard,number,garnet,full,modifyHan,bonus,blackChips};
