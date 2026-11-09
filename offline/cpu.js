'use strict';
const analyzeDefense=require('./defense'),Profiles=require('./cpu-profiles'),Search=require('./cpu-search');
// Deliberately use only our hand, discards, exposed melds and visible indicators.
module.exports=function(M,J){
 const normal=t=>M.Shoupai.normal_pai(t).slice(0,2),legacy=require('./cpu-legacy')(M,J);
 function context(p){
  const visible=new Map(),physical=new Map(),model=p.model||{},add=t=>{const key=t.slice(0,2);physical.set(key,(physical.get(key)||0)+1);t=normal(t);visible.set(t,(visible.get(t)||0)+1);};
  J.rawTiles(p.shoupai.toString()).forEach(add);
  for(let l=0;l<4;l++){
   for(const t of model.he?.[l]?._pai||[])if(!/[+=-]/.test(t))add(t);
   if(l!==p._menfeng)for(const meld of model.shoupai?.[l]?._fulou||[])J.rawTiles(meld).forEach(add);
  }
  for(const t of model.shan?.baopai||[])add(t);
  const threats=[];for(let l=0;l<4;l++)if(l!==p._menfeng&&model.shoupai?.[l]?.lizhi)threats.push(l);
  const cfg=p.cpuTuning||Profiles.profile(p.cpuLevel||p._rule?.cpuLevel||'standard',p._rule?.nekkyou?'four-hard':'four-standard');
  return {p,cfg,model,visible,physical,threats,left:t=>Math.max(0,4-(visible.get(normal(t))||0)),cache:new Map(),futureCache:new Map()};
 }
 function params(c,hand,choice){return M.Util.hule_param({rule:c.p._rule,menfeng:c.p._menfeng,zhuangfeng:c.model.zhuangfeng||0,lizhi:hand.lizhi?(c.model.openRiichi?.[c.p._menfeng]?3:1):0,baopai:c.model.shan?.baopai||[],jewelChoice:choice});}
 function winValue(c,hand,ron=null,choice){
  const r=M.Util.hule(hand,ron,params(c,hand,choice));if(!r?.defen)return 0;
  const result={...r,shoupai:ron?hand.clone().zimo(ron.slice(0,2)).toString():hand.toString(),winningTile:ron?.slice(0,2)||hand._zimo,indicators:c.model.shan?.baopai||[],baojia:ron?0:null};
  const id=c.model.player_id?.[c.p._menfeng]??c.p._id??0,points=c.model.defen?.[id]??25000;
  const placement=c.cfg.placementEV?Search.placementGain((c.model.player_id||[0,1,2,3]).map(id=>c.model.defen?.[id]??25000),c.p._menfeng,r.fenpei,c.p._rule.nekkyou?[15,5,-5,-15]:[50,25,-25,-50],c.model.jushu):0;
  return r.defen+(J.bonus(result,points,c.p._rule.unlockedYaku,c.p._rule)*(ron?1:3)+placement)*c.cfg.chipValue;
 }
 function gemValue(c,hand){
  const items=J.owned(c.p._rule,hand),indicators=c.model.shan?.baopai||[];
  let chips=0,han=0;for(const g of items){
   han+=g.han;chips+=g.chips;
   if(g.effect==='lapis')chips+=4;
   if(g.effect==='garnet'||g.effect==='gane')chips+=J.garnet(indicators);
   if(g.effect==='crystal')chips+=5;
   if(g.effect==='tourmaline'){const id=c.model.player_id?.[c.p._menfeng]??0,points=c.model.defen?.[id]??25000;chips+=c.p._rule.nekkyou&&points===0?10:Math.max(0,...String(Math.floor(Math.max(0,points)/100)).slice(-3).split('').map(Number));}
   if(g.effect==='pearl')han+=3;
   if(g.effect==='carnelian')han+=3;
   if(g.pocchi&&hand.lizhi)chips+=5;
  }
  const amethysts=items.filter(g=>g.effect==='amethyst').length;chips*=c.p._rule.nekkyou?1+amethysts:2**amethysts;
  return Math.min(100,han*5+chips*2+(items.length>=3?8:0)+(J.full(c.p._rule,items)?50:0));
 }
 function evaluate(c,hand){
  const key=hand.toString();if(c.cache.has(key))return c.cache.get(key);
  const n=M.Util.xiangting(hand),waits=n>=0?M.Util.tingpai(hand):[],ukeire=waits.reduce((v,t)=>v+c.left(t),0);
  let predictedWin=0;let value=-n*1000+ukeire*c.cfg.wait+gemValue(c,hand)*c.cfg.gem+(hand.lizhi?c.cfg.riichi:0);
  if(n===0){
   // Score real completed hands, including the selected bonus yaku and gem effects.
   let total=0,weight=0;const gems=Object.keys(c.p._rule.gemTiles||{}),draws=new Map();
   for(const t of waits){const specials=gems.filter(g=>normal(g)===t),unseen=specials.filter(g=>!c.physical.has(g));draws.set(t,Math.max(0,c.left(t)-unseen.length));for(const g of unseen)draws.set(g,1);}
   for(const g of gems){const gem=c.p._rule.gemTiles[g];if(gem.pocchi&&(hand.lizhi||gem.id==='gold-pocchi')&&!c.physical.has(g))draws.set(g,1);}
   for(const [t,left] of draws){if(!left)continue;const complete=hand.clone().zimo(t),v=Math.max(winValue(c,complete,null,'chips'),winValue(c,complete,null,'han'));total+=left*v;weight+=left;if(v&&!waits.includes(normal(t)))value+=left*6;}

   if(weight&&total)predictedWin=total/weight;
   if(weight&&total)value+=Math.min(c.cfg.readyCap,Math.log2(1+total/weight)*c.cfg.ready);
   if(!ukeire)value-=180;
  }
  const result={value,n,ukeire,winValue:predictedWin};c.cache.set(key,result);return result;
 }
 function openDanger(c,t){
  if(c.p.shoupai.lizhi)return 0;
  return c.threats.filter(l=>c.model.openRiichi?.[l]).reduce((n,l)=>{
   const h=c.model.shoupai[l];
   // This hand is public only after an open declaration. Never inspect closed hands.
   if((c.model.he?.[l]?._pai||[]).some(p=>normal(p)===normal(t)))return n;
   const r=M.Util.hule(h,t.slice(0,2)+'_+=-'[(4+c.p._menfeng-l)%4],M.Util.hule_param({rule:c.p._rule,menfeng:l,zhuangfeng:c.model.zhuangfeng||0,lizhi:3}));
   return n+(r?.defen?1:0);
  },0);
 }
 function danger(c,t){
  t=normal(t);return c.threats.reduce((sum,l)=>sum+analyzeDefense({tile:t,visible:c.visible,river:(c.model.he?.[l]?._pai||[]).map(normal),concealedTiles:13-3*(c.model.shoupai?.[l]?._fulou?.length||0)}).score,0);
 }
 function chooseDiscard(c,options){let best=null,value=-Infinity;const ranked=[];
  for(const a of options){const h=c.p.shoupai.clone().dapai(a.reply.dapai),e=evaluate(c,h),risk=danger(c,a.reply.dapai);
   let factor=e.n>0?c.cfg.defense:c.cfg.defenseReady;const id=c.model.player_id?.[c.p._menfeng]??0,points=c.model.defen||[];if(c.cfg.placement&&c.model.jushu>=3&&points.length){const lead=points[id]-Math.max(...points.filter((_,i)=>i!==id));factor*=lead>0?1+c.cfg.placement:1-c.cfg.placement/2;}
   if(c.cfg.tacticalDefense&&c.threats.length)factor=Search.defenseFactor(Math.max(factor,e.n>0?450:120),{enabled:true,shanten:e.n,turn:c.model.he?.[c.p._menfeng]?._pai.length||0,remaining:70-(c.model.he||[]).reduce((v,h)=>v+(h._pai?.length||0),0),dealerThreat:c.threats.includes(0),ownValue:e.winValue});
   const open=openDanger(c,a.reply.dapai);let v=e.value-risk*factor-open*1000000;if(c.cfg.tacticalDefense&&c.threats.length&&e.n>0)v+=e.n*650;ranked.push({a,v,n:e.n,open,h});if(v>value){value=v;best=a;}
  }if(c.cfg.lookaheadWeight||c.cfg.lookaheadValueWeight){const cache=new Map(),unseen=Math.max(1,136-[...c.visible.values()].reduce((v,n)=>v+n,0));ranked.sort((a,b)=>b.v-a.v);const ceiling=ranked[0].v;for(const r of ranked.slice(0,c.cfg.lookaheadValueWeight?2:3)){if(r.open||r.n!==1||r.v<ceiling-300)continue;const k=r.h.toString();if(!cache.has(k))cache.set(k,Search.forecast(r.h,{shanten:M.Util.xiangting,waits:M.Util.tingpai,left:c.left,normal,keep:h=>gemValue(c,h),unseen}).value);r.v+=cache.get(k)*(c.cfg.lookaheadWeight||0);if(c.cfg.lookaheadValueWeight){const wild=Object.keys(c.p._rule.gemTiles||{}).filter(t=>c.p._rule.gemTiles[t].pocchi&&(r.h.menqian||c.p._rule.gemTiles[t].id==='gold-pocchi'));r.v+=Search.valuedForecast(r.h,{shanten:M.Util.xiangting,waits:M.Util.tingpai,left:c.left,normal,keep:h=>gemValue(c,h),unseen,expand:t=>futurePool(c,t),score:(h,t)=>futureValue(c,h,t),wild,scoreBudget:c.cfg.valueBudget||128}).value*c.cfg.lookaheadValueWeight;}}ranked.sort((a,b)=>b.v-a.v);best=ranked[0].a;}if(c.cfg.beginner&&((c.p._beginnerTurns=(c.p._beginnerTurns||0)+1)%3===0)){ranked.sort((a,b)=>b.v-a.v);const second=ranked.slice(1).find(r=>!r.open&&r.n<=ranked[0].n&&r.a.reply.dapai.slice(0,2)!==ranked[0].a.reply.dapai.slice(0,2));if(second)return second.a;}return best;
 }
 function futurePool(c,t){
  const n=normal(t),gems=Object.keys(c.p._rule.gemTiles||{}).filter(g=>g!==n&&normal(g)===n);
  if(t!==n)return [{tile:t,count:Math.max(0,1-(c.physical.get(t)||0)),special:true}];
  return [{tile:n,count:Math.max(0,4-gems.length-(c.physical.get(n)||0)),special:false},...gems.map(g=>({tile:g,count:Math.max(0,1-(c.physical.get(g)||0)),special:true}))];
 }
 function futureValue(c,ready,t){
  const h=ready.clone(),n=normal(t);if(h._bingpai[n[0]][+n[1]]>=4)return 0;
  const id=c.model.player_id?.[c.p._menfeng]??0;if(h.menqian&&(c.model.defen?.[id]??25000)>=1000)h._lizhi=true;
  h.zimo(t);const key=h.toString();if(c.futureCache.has(key))return c.futureCache.get(key);
  let v=winValue(c,h,null,'chips');if(J.has(c.p._rule,h,'carnelian'))v=Math.max(v,winValue(c,h,null,'han'));c.futureCache.set(key,v);return v;
 }
 function openYaku(c,h){
  const text=J.rawTiles(h.toString()).map(normal).join(''),honors=[5,6,7,c.p._menfeng+1,...(c.p._rule['場風牌']||[c.model.zhuangfeng+1])];
  return honors.some(n=>(h._bingpai.z[n]||0)>=3)||h._fulou.some(m=>{m=M.Shoupai.normal_pai(m);return m[0]==='z'&&honors.includes(+m[1]);})||(!text.includes('z')&&!/[19]/.test(text)&&c.p._rule['クイタンあり']!==false)||J.has(c.p._rule,h,'turquoise');
 }
 return function cpu(p,options){
  const level=p.cpuLevel||p._rule?.cpuLevel||'standard';
  if(!p.cpuTuning&&(level==='standard'||level==='expert'&&Profiles.metadata.selected?.[p._rule?.nekkyou?'four-hard':'four-standard']==='baseline'))return legacy(p,options);
  if(!options.length)return {};
  const c=context(p),wins=options.filter(a=>a.reply.hule);
  if(wins.length){const d=p.message?.dapai,ron=d?d.p.slice(0,2)+'_+=-'[(4+d.l-p._menfeng)%4]:null;
   let best=wins[0],value=-Infinity;for(const a of wins){const v=winValue(c,p.shoupai,ron,a.reply.jewelChoice);if(v>value){best=a;value=v;}}return best.reply;
  }
  const discards=options.filter(a=>a.reply.dapai);if(discards.length)return chooseDiscard(c,discards).reply;
  if(p.shoupai.lizhi)return {};
  const base=evaluate(c,p.shoupai);let best=null,value=base.value;
  for(const a of options.filter(a=>a.reply.fulou)){
   if(c.threats.length)continue;const h=p.shoupai.clone().fulou(a.reply.fulou);if(!openYaku(c,h))continue;
   // A call is useful only after its mandatory discard, not just on the 14-tile shape.
   if(!h._zimo)continue; // Avoid speculative open kans without an improvement draw.
   for(const t of h.get_dapai()||[]){const after=h.clone().dapai(t),e=evaluate(c,after);if(e.n>=base.n)continue;const v=e.value-c.cfg.callCost;if(v>value){best=a;value=v;}}
  }
  return best?.reply||{};
 };
};
