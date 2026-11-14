'use strict';
// Bounded public-information search. These are heuristic values, not calibrated EVs.
function rankValue(points,self,payout,scale=12000){
 let p=[1];for(let id=0;id<points.length;id++)if(id!==self){const q=1/(1+Math.exp(Math.max(-30,Math.min(30,(points[self]-points[id])/scale))));const next=Array(p.length+1).fill(0);for(let n=0;n<p.length;n++){next[n]+=p[n]*(1-q);next[n+1]+=p[n]*q;}p=next;}
 return p.reduce((v,p,n)=>v+p*payout[n],0);
}
function placementGain(points,self,delta,payout,round){
 if(!points?.length||!delta?.length)return 0;
 const scale=Math.max(4000,16000-3000*Math.min(4,round||0));
 return rankValue(points.map((p,i)=>p+(delta[i]||0)),self,payout,scale)-rankValue(points,self,payout,scale);
}
function defenseFactor(base,{enabled=false,shanten=0,turn=0,remaining=70,ownValue=0,dealerThreat=false}={}){
 if(!enabled)return base;
 // A combinatorial danger index is deliberately not presented as a probability.
 const urgency=Math.min(1,Math.max(0,(turn-5)/12)),distance=Math.min(2,Math.max(0,shanten));
 const reward=Math.min(1,Math.max(0,ownValue/24000));
 return base*(1+urgency+distance*.6+(dealerThreat?.35:0))*(1-reward*.55)*(remaining<12&&shanten===0?.7:1);
}
function forecast(hand,{shanten,waits,left,normal,keep=()=>0,budget=420,unseen=100}){
 if(shanten(hand)!==1||hand.lizhi)return {value:0,nodes:0};
 let sum=0,nodes=0;
 for(const draw of waits(hand)){
  const count=left(draw);if(!count||hand._bingpai[draw[0]][+draw[1]]>=4)continue;
  const full=hand.clone().zimo(draw);let best=0;
  for(const cut of full.get_dapai()||[]){
   if(++nodes>budget)return {value:sum/Math.max(1,unseen),nodes:nodes-1,truncated:true};
   const next=full.clone().dapai(cut);if(shanten(next)!==0)continue;
   const live=waits(next).reduce((v,t)=>v+Math.max(0,left(t)-(normal(t)===normal(draw)?1:0)),0);
   best=Math.max(best,live+Math.min(4,Math.max(0,keep(next))*.04));
  }
  sum+=count*best;
 }
 return {value:sum/Math.max(1,unseen),nodes,truncated:false};
}
// Deterministic stratified integration: exact for short pools, bounded otherwise.
function integrate(pool,score,slots){
 const total=pool.reduce((s,x)=>s+x.count,0);if(!total||slots<1)return 0;
 if(pool.length<=slots)return pool.reduce((s,x)=>s+x.count*score(x.tile),0);
 let sum=0;for(let i=0;i<slots;i++){const ticket=(i+.5)*total/slots;let n=0;for(const x of pool){n+=x.count;if(n>=ticket){sum+=score(x.tile);break;}}}
 return total*sum/slots;
}
function valuedForecast(hand,{shanten,waits,left,normal,keep=()=>0,unseen=100,expand,score,wild=[],budget=420,scoreBudget=128}){
 if(shanten(hand)!==1||hand.lizhi)return {value:0,nodes:0,scoreCalls:0};
 const branches=[];let nodes=0;
 for(const draw of waits(hand)){
  const count=left(draw);if(!count||hand._bingpai[draw[0]][+draw[1]]>=4)continue;
  const full=hand.clone().zimo(draw);let best=null,v=-Infinity;
  for(const cut of full.get_dapai()||[]){
   if(++nodes>budget)break;
   const next=full.clone().dapai(cut);if(shanten(next)!==0)continue;
   const live=waits(next).reduce((s,t)=>s+Math.max(0,left(t)-(normal(t)===normal(draw)?1:0)),0),q=live+Math.min(4,Math.max(0,keep(next))*.04);
   if(q>v){v=q;best=next;}
  }
  if(best)branches.push({draw,count,hand:best});if(nodes>=budget)break;
 }
 let value=0,calls=0;
 const perBranch=Math.max(1,Math.floor(scoreBudget/Math.max(1,branches.length)));
 for(const b of branches){
  const pool=new Map();for(const t of [...waits(b.hand),...wild])for(const x of expand(t))if(x.count>0)pool.set(x.tile,{...x});
  for(const x of pool.values())if(normal(x.tile)===normal(b.draw)){const n=left(normal(b.draw));x.count*=n?Math.max(0,n-1)/n:0;}
  const all=[...pool.values()].filter(x=>x.count>0),special=all.filter(x=>x.special),plain=all.filter(x=>!x.special);
  const slots=Math.min(perBranch,scoreBudget-calls),specialSlots=plain.length?Math.min(special.length,Math.max(1,Math.floor(slots/2))):slots;
  const cache=new Map(),evaluate=t=>{if(cache.has(t))return cache.get(t);if(calls>=scoreBudget)return 0;calls++;const reward=score(b.hand,t);cache.set(t,reward);return reward;};
  value+=b.count*(integrate(special,evaluate,specialSlots)+integrate(plain,evaluate,slots-specialSlots));
 }
 return {value:value/Math.max(1,unseen)**2,nodes:Math.min(nodes,budget),scoreCalls:calls};
}
module.exports={rankValue,placementGain,defenseFactor,forecast,valuedForecast};
