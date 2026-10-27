'use strict';
// A public-information combinatorial risk index, NOT a calibrated deal-in probability.
const kinds=[];for(const s of ['m','p','s','z'])for(let n=1;n<=(s==='z'?7:9);n++)kinds.push(s+n);
const choose2=n=>n*(n-1)/2;
module.exports=function analyze({tile,visible,river=[],concealedTiles=13}){
 if(river.includes(tile))return {score:0,combinations:0,single:0,pairs:0,safe:true};
 const left=t=>Math.max(0,4-(visible.get(t)||0)),total=kinds.reduce((a,t)=>a+left(t),0),u=left(tile),s=tile[0],n=+tile[1];
 let pairs=choose2(u); // Two copies make a shanpon wait; one copy makes a tanki wait.
 const shapes=[];
 if(s!=='z')for(const [a,b,other]of [[n-2,n-1,n-3],[n-1,n+1,null],[n+1,n+2,n+3]]){
  if(a<1||b>9)continue;
  // A ryanmen wait that also wins on an own-discarded tile is furiten.
  if(other>=1&&other<=9&&river.includes(s+other))continue;
  const ways=left(s+a)*left(s+b);pairs+=ways;shapes.push({tiles:[s+a,s+b],ways});
 }
 const h=Math.max(1,Math.min(concealedTiles,total)),single=total?h*u/total:0,pairExpectation=total>1?choose2(h)*pairs/choose2(total):0,expected=single+pairExpectation;
 return {score:expected/(1+expected),combinations:pairs+u,single:u,pairs,shapes,safe:false};
};
