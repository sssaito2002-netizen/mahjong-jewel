'use strict';
const analyzeDefense=require('./defense');
// Deliberately use only our hand, discards, exposed melds and visible indicators.
module.exports=function(M,J){
 const normal=t=>M.Shoupai.normal_pai(t).slice(0,2);
 function context(p){
  const visible=new Map(),physical=new Map(),model=p.model||{},add=t=>{const key=t.slice(0,2);physical.set(key,(physical.get(key)||0)+1);t=normal(t);visible.set(t,(visible.get(t)||0)+1);};
  J.rawTiles(p.shoupai.toString()).forEach(add);
  for(let l=0;l<4;l++){
   for(const t of model.he?.[l]?._pai||[])if(!/[+=-]/.test(t))add(t);
   if(l!==p._menfeng)for(const meld of model.shoupai?.[l]?._fulou||[])J.rawTiles(meld).forEach(add);
  }
  for(const t of model.shan?.baopai||[])add(t);
  const threats=[];for(let l=0;l<4;l++)if(l!==p._menfeng&&model.shoupai?.[l]?.lizhi)threats.push(l);
  return {p,model,visible,physical,threats,left:t=>Math.max(0,4-(visible.get(normal(t))||0)),cache:new Map()};
 }
 function params(c,hand,choice){return M.Util.hule_param({rule:c.p._rule,menfeng:c.p._menfeng,zhuangfeng:c.model.zhuangfeng||0,lizhi:hand.lizhi?1:0,baopai:c.model.shan?.baopai||[],jewelChoice:choice});}
 function winValue(c,hand,ron=null,choice){
  const r=M.Util.hule(hand,ron,params(c,hand,choice));if(!r?.defen)return 0;
  const result={...r,shoupai:ron?hand.clone().zimo(ron.slice(0,2)).toString():hand.toString(),winningTile:ron?.slice(0,2)||hand._zimo,indicators:c.model.shan?.baopai||[],baojia:ron?0:null};
  const id=c.model.player_id?.[c.p._menfeng]??c.p._id??0,points=c.model.defen?.[id]??25000;
  return r.defen+J.bonus(result,points,c.p._rule.unlockedYaku,c.p._rule)*250*(ron?1:3);
 }
 function gemValue(c,hand){
  const items=J.owned(c.p._rule,hand),indicators=c.model.shan?.baopai||[];
  let chips=0,han=0;for(const g of items){
   han+=g.han;chips+=g.chips;
   if(g.effect==='lapis')chips+=4;
   if(g.effect==='garnet'||g.effect==='gane')chips+=J.garnet(indicators);
   if(g.effect==='crystal')chips+=5;
   if(g.effect==='tourmaline')chips+=5;
   if(g.effect==='pearl')han+=3;
   if(g.effect==='carnelian')han+=3;
   if(g.pocchi&&hand.lizhi)chips+=5;
  }
  chips*=2**items.filter(g=>g.effect==='amethyst').length;
  return Math.min(100,han*5+chips*2+(items.length>=3?8:0)+(J.full(c.p._rule,items)?50:0));
 }
 function evaluate(c,hand){
  const key=hand.toString();if(c.cache.has(key))return c.cache.get(key);
  const n=M.Util.xiangting(hand),waits=n>=0?M.Util.tingpai(hand):[],ukeire=waits.reduce((v,t)=>v+c.left(t),0);
  let value=-n*1000+ukeire*6+gemValue(c,hand)+(hand.lizhi?28:0);
  if(n===0){
   // Score real completed hands, including the selected bonus yaku and gem effects.
   let total=0,weight=0;const gems=Object.keys(c.p._rule.gemTiles||{}),draws=new Map();
   for(const t of waits){const specials=gems.filter(g=>normal(g)===t),unseen=specials.filter(g=>!c.physical.has(g));draws.set(t,Math.max(0,c.left(t)-unseen.length));for(const g of unseen)draws.set(g,1);}
   for(const g of gems){const gem=c.p._rule.gemTiles[g];if(gem.pocchi&&(hand.lizhi||gem.id==='gold-pocchi')&&!c.physical.has(g))draws.set(g,1);}
   for(const [t,left] of draws){if(!left)continue;const complete=hand.clone().zimo(t),v=Math.max(winValue(c,complete,null,'chips'),winValue(c,complete,null,'han'));total+=left*v;weight+=left;if(v&&!waits.includes(normal(t)))value+=left*6;}

   if(weight&&total)value+=Math.min(180,Math.log2(1+total/weight)*10);
   if(!ukeire)value-=180;
  }
  const result={value,n,ukeire};c.cache.set(key,result);return result;
 }
 function danger(c,t){
  t=normal(t);return c.threats.reduce((sum,l)=>sum+analyzeDefense({tile:t,visible:c.visible,river:(c.model.he?.[l]?._pai||[]).map(normal),concealedTiles:13-3*(c.model.shoupai?.[l]?._fulou?.length||0)}).score,0);
 }
 function chooseDiscard(c,options){let best=null,value=-Infinity;
  for(const a of options){const h=c.p.shoupai.clone().dapai(a.reply.dapai),e=evaluate(c,h),risk=danger(c,a.reply.dapai);
   const v=e.value-risk*(e.n>0?500:100);if(v>value){value=v;best=a;}
  }return best;
 }
 function openYaku(c,h){
  const text=J.rawTiles(h.toString()).map(normal).join(''),honors=[5,6,7,c.p._menfeng+1,...(c.p._rule['場風牌']||[c.model.zhuangfeng+1])];
  return honors.some(n=>(h._bingpai.z[n]||0)>=3)||h._fulou.some(m=>{m=M.Shoupai.normal_pai(m);return m[0]==='z'&&honors.includes(+m[1]);})||(!text.includes('z')&&!/[19]/.test(text)&&c.p._rule['クイタンあり']!==false)||J.has(c.p._rule,h,'turquoise');
 }
 return function cpu(p,options){
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
   for(const t of h.get_dapai()||[]){const after=h.clone().dapai(t),e=evaluate(c,after);if(e.n>=base.n)continue;const v=e.value-80;if(v>value){best=a;value=v;}}
  }
  return best?.reply||{};
 };
};
