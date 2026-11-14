/* Client-side, pure calculations. No privileged wall or opponent hand data. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.JewelCalculator=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const HONORS=['E','S','W','N','P','F','C'];
const TYPES=[...['m','p','s'].flatMap(s=>Array.from({length:9},(_,i)=>`${i+1}${s}`)),...HONORS];
function counts(tiles){const a=Array(34).fill(0);for(const t of tiles){const i=TYPES.indexOf(typeof t==='string'?t:t.base);if(i<0)throw Error('不正な牌');if(++a[i]>4)throw Error('同一牌が5枚以上あります');}return a;}
function meldable(a,needed){if(needed===0)return a.every(x=>x===0);let i=a.findIndex(x=>x>0);if(i<0)return false;
 if(a[i]>=3){a[i]-=3;if(meldable(a,needed-1)){a[i]+=3;return true;}a[i]+=3;}
 if(i<27&&i%9<=6&&a[i+1]&&a[i+2]){a[i]--;a[i+1]--;a[i+2]--;if(meldable(a,needed-1)){a[i]++;a[i+1]++;a[i+2]++;return true;}a[i]++;a[i+1]++;a[i+2]++;}
 return false;}
function analyzeHand(tiles,{openMelds=0}={}){
 const a=counts(tiles);if(!Number.isInteger(openMelds)||openMelds<0||openMelds>4)throw Error('副露数が不正です');
 if(tiles.length!==14-3*openMelds)return {complete:false,shape:null,reason:'和了形を判定する枚数ではありません'};
 if(openMelds===0){const orphans=[0,8,9,17,18,26,27,28,29,30,31,32,33];if(orphans.every(i=>a[i]>0)&&orphans.some(i=>a[i]>=2))return {complete:true,shape:'国士無双'};
 if(a.filter(x=>x===2).length===7)return {complete:true,shape:'七対子'};}
 for(let i=0;i<34;i++)if(a[i]>=2){a[i]-=2;const ok=meldable(a,4-openMelds);a[i]+=2;if(ok)return {complete:true,shape:'標準形'};}
 return {complete:false,shape:null,reason:'和了形ではありません'};
}
function previewJewel({tiles=[],baseHan=0,baseChips=0,winningTile=null,points=25000,indicator=null,tsumo=false}={}){
 if(!Number.isInteger(baseHan)||baseHan<0||!Number.isInteger(baseChips)||baseChips<0)throw Error('翻・祝儀には0以上の整数を入力');
 const jewels=tiles.map(t=>t.jewel?.id).filter(Boolean);let han=baseHan,base=baseChips;const effects=[],unresolved=[];
 const lapis=jewels.filter(id=>id==='lapis').length,amethyst=jewels.filter(id=>id==='amethyst'||id==='amethyst-pocchi').length;
 const tourmaline=jewels.filter(id=>id==='tourmaline').length;
 han+=lapis*2;han+=jewels.filter(id=>id==='amethyst').length*2;han+=tourmaline*2;
 // Lapis uses the resulting han. Further han multipliers can be added before this step.
 if(lapis){base+=lapis*han;effects.push(`ラピスラズリ：+${lapis*2}翻・祝儀+${lapis*han}枚`);}
 const standing=Math.floor(Math.max(points,0)/100)%10;const thousands=Math.floor(Math.max(points,0)/1000)%10;const tenThousands=Math.floor(Math.max(points,0)/10000)%10;
 if(tourmaline){const n=Math.max(standing,thousands,tenThousands);base+=n*tourmaline;effects.push(`トルマリン：+${tourmaline*2}翻・祝儀+${n*tourmaline}枚（仮計算）`);}
 if(amethyst){base+=amethyst;effects.push(`アメジスト：自身の祝儀+${amethyst}枚・倍化${amethyst}回`);}
 const total=base*(2**amethyst);return {han,baseChips:base,totalChips:total,tsumo,effects,unresolved:['通常役・符・役満・全役解放の判定は未実装','アメジスト白ポッチは特殊ツモ成立を検証していません','祝儀倍化の最終裁定と複数枚適用順は要確認',...unresolved],status:'参考計算（正式な和了精算ではありません）'};
}
return {analyzeHand,previewJewel,TYPES};
});
