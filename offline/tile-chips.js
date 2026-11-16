'use strict';
const BASES=['m','p','s','z'].flatMap(s=>Array.from({length:s==='z'?7:9},(_,i)=>s+(i+1)));
function color(value){if(typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value))throw Error('枠の色は6桁のカラーコードです');return value.toLowerCase();}
function validate(value=[],{sanma=false}={}){
 if(!Array.isArray(value)||value.length>34)throw Error('牌別祝儀の形式が不正です');
 const seen=new Set(),out=[];
 for(const r of value){if(!r||!BASES.includes(r.tile)||sanma&&r.tile[0]==='m'&&!['m1','m9'].includes(r.tile))throw Error('この対局では使えない牌種です');
  if(seen.has(r.tile))throw Error('同じ牌種が重複しています');seen.add(r.tile);
  if(!Number.isSafeInteger(r.chips)||r.chips<0||r.chips>1000)throw Error('牌別祝儀は0〜1000枚の整数です');
  const frame=r.color===undefined?{}:{color:color(r.color)};if(r.chips)out.push({tile:r.tile,chips:r.chips,...frame});
 }
 return out.sort((a,b)=>BASES.indexOf(a.tile)-BASES.indexOf(b.tile));
}
const label=t=>t[0]==='z'?['','東','南','西','北','白','發','中'][+t[1]]:t[1]+({m:'萬',p:'筒',s:'索'}[t[0]]);
function breakdown(config,tiles,{north=0}={}){
 const counts=new Map();for(const t of tiles)counts.set(t,(counts.get(t)||0)+1);if(north)counts.set('z4',(counts.get('z4')||0)+north);
 return validate(config).flatMap(r=>{const count=counts.get(r.tile)||0;return count?[{label:label(r.tile)+'・牌別祝儀',tile:r.tile,count,perTile:r.chips,amount:count*r.chips,reason:count+'枚 × '+r.chips+'枚'}]:[];});
}
const summary=value=>validate(value).map(r=>label(r.tile)+' '+r.chips+'枚／1枚').join('・')||'なし';
module.exports={BASES,validate,color,label,breakdown,summary};
