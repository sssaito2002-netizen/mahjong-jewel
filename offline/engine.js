'use strict';
const M = require('../vendor/majiang-core/lib');
const PAYOUT = [50,25,-25,-50];
const UNLOCK_YAKU = ['平和','断幺九','一盃口','三色同順','一気通貫','混全帯幺九','七対子','対々和','三暗刻','三色同刻','混老頭','小三元','混一色','純全帯幺九','二盃口','清一色','翻牌 白','翻牌 發','翻牌 中'];
function rule(extra={}) {
 const modes=extra.pocchiModes||[extra.pocchiMode||'amethyst-white'];
 const allowed=['white','amethyst-white','gold','gane'];
 if(!Array.isArray(modes)||modes.length>3||new Set(modes).size!==modes.length||modes.some(x=>!allowed.includes(x))||(modes.includes('white')&&modes.includes('amethyst-white')))throw Error('ポッチ構成が不正です');
 return M.rule({'場数':1,'延長戦方式':0,'赤牌':{m:1,p:1,s:1},jewelBonus:true,fullJewel:true,...extra,
  pocchiModes:modes.slice(),whitePocchi:modes.includes('white')||modes.includes('amethyst-white'),pocchiAmethyst:modes.includes('amethyst-white'),goldPocchi:modes.includes('gold'),ganePocchi:modes.includes('gane')});
}
function actions(p,msg) {
 const out=[]; const self=p._menfeng, hand=p.shoupai;
 if(!hand)return out;
 const z=msg.zimo||msg.gangzimo;
 const add=(label,reply)=>out.push({label,reply});
 if(z && z.l===self || msg.fulou && msg.fulou.l===self && !msg.fulou.m.match(/\d{4}/)) {
  if(z && p.allow_hule(hand,null,!!msg.gangzimo)) add('ツモ',{hule:'-'});
  if(z) for(const m of p.get_gang_mianzi(hand)||[]) add('カン '+m,{gang:m});
  if(z && p.allow_pingju(hand)) add('九種九牌',{pingju:true});
  for(const tile of p.get_dapai(hand)||[]) {
   add('打牌 '+tile,{dapai:tile});
   if(z && p.allow_lizhi(hand,tile)) add('リーチ '+tile,{dapai:tile+'*'});
  }
 } else if(msg.dapai && msg.dapai.l!==self) {
  const d=msg.dapai, tile=d.p.slice(0,2)+'_+=-'[(4+d.l-self)%4];
  if(p.allow_hule(hand,tile)) add('ロン',{hule:'-'});
  for(const [name,fn] of [['ポン','get_peng_mianzi'],['チー','get_chi_mianzi'],['カン','get_gang_mianzi']])
   for(const m of p[fn](hand,tile)||[]) add(name+' '+m,{fulou:m});
  if(out.length) add('見送り',{});
 } else if(msg.gang && msg.gang.l!==self && !msg.gang.m.match(/^[mpsz]\d{4}$/)) {
  const g=msg.gang, tile=g.m[0]+g.m.slice(-1)+'_+=-'[(4+g.l-self)%4];
  if(p.allow_hule(hand,tile,true)) { add('ロン（槍槓）',{hule:'-'}); add('見送り',{}); }
 }
 return out;
}
function cpu(p,options) {
 const win=options.find(a=>a.reply.hule); if(win)return win.reply;
 const discards=options.filter(a=>a.reply.dapai);
 if(discards.length) {
  let best,score=-Infinity;
  for(const a of discards) {
   const h=p.shoupai.clone().dapai(a.reply.dapai), n=M.Util.xiangting(h);
   let value=-n*1000;
   if(n>=0) value+=M.Util.tingpai(h).reduce((s,t)=>s+4-(h._bingpai[t[0]][+t[1]]||0),0);
   if(a.reply.dapai.endsWith('*'))value+=50;
   if(a.reply.dapai[1]==='0')value-=5;
   if(value>score){score=value;best=a;}
  }
  return best.reply;
 }
 // Only call when doing so improves shanten and preserves an obvious open yaku.
 for(const a of options.filter(a=>a.reply.fulou)) {
  const h=p.shoupai.clone().fulou(a.reply.fulou);
  const honors=[5,6,7,p._menfeng+1,p.model.zhuangfeng+1];
  const yakuhai=h._fulou.some(m=>m[0]==='z'&&honors.includes(+m[1]));
  const simple= !/[19]/.test(h.toString().replace(/z\d+/g,''))&&!h.toString().includes('z');
  if((yakuhai||simple) && M.Util.xiangting(h)<M.Util.xiangting(p.shoupai)) return a.reply;
 }
 return {};
}
class Player extends M.Player {
 constructor(decide,onUpdate=()=>{}) {super();this.decide=decide;this.onUpdate=onUpdate;}
 action(msg,callback) {
  this.message=msg;
  super.action(msg,callback);
  if(!callback)this.onUpdate(msg,this);
 }
 respond() {
  this.onUpdate(this.message,this);
  const opts=actions(this,this.message);
  const callback=this._callback;
  if(!opts.length)return callback({});
  this.decide(opts,reply=>callback(reply||{}),this.message,this);
 }

}
for(const type of ['kaiju','qipai','zimo','dapai','fulou','gang','hule','pingju','jieju'])Player.prototype['action_'+type]=function(){this.respond();};
function indicatorNumber(p) {return p && p[0]!=='z' ? (+p[1]||5) : 0;}
function garnetValue(indicators=[],ura=[]) {return Math.max(0,...indicators.map((p,i)=>indicatorNumber(p[0]==='z'?ura[i]:p)));}
function bonus(h,points,unlockedYaku=null) {
 const text=h.shoupai, m=(text.match(/m[^psz,]*/g)||[]).join(''), p=(text.match(/p[^msz,]*/g)||[]).join(''), s=(text.match(/s[^mpz,]*/g)||[]).join('');
 const lapis=(m.match(/0/g)||[]).length, amethyst=(p.match(/0/g)||[]).length+(h.pocchiAmethyst===false?0:((text.match(/z[^mps,]*/g)||[]).join('').match(/0/g)||[]).length), tourmaline=(s.match(/0/g)||[]).length;
 const usual=(h.hupai||[]).filter(y=>['一発','裏ドラ'].includes(y.name)).reduce((n,y)=>n+(+y.fanshu||0),0);
 const honors=(text.match(/z[^mps,]*/g)||[]).join('');
 const gold=(honors.match(/8/g)||[]).length*4;
 const north=(honors.match(/9/g)||[]).length*Math.max(garnetValue(h.indicators,h.garnetUra),indicatorNumber(h.winningTile));
 const unlocked=(h.hupai||[]).some(y=>y.name===unlockedYaku)?5:0;
 const digit=Math.max(...String(Math.floor(Math.max(0,points)/100)).slice(-3).split('').map(Number),0);
 return (usual+unlocked+gold+north+lapis*(h.fanshu||13)+amethyst+tourmaline*digit)*2**amethyst;
}
function transfer(chips,winner,loser,n) {
 if(loser===null){for(let id=0;id<4;id++)if(id!==winner){chips[id]-=n;chips[winner]+=n;}}
 else{chips[loser]-=n;chips[winner]+=n;}
}
class Game extends M.Game {
 constructor(players,done,extra={}) {
  super(players,done,rule({unlockedYaku:UNLOCK_YAKU[Math.floor(Math.random()*UNLOCK_YAKU.length)],...extra}),'Mahjong Jewel — Offline');
  this.chips=[0,0,0,0];this.busted=new Set();this.bonusLog=[];
 }
 add_paipu(msg) {
  if(msg.hule){
   const h=msg.hule, ids=this.model.player_id, winner=ids[h.l], loser=h.baojia===null?null:ids[h.baojia];
   h.pocchiAmethyst=this._rule.pocchiAmethyst;
   h.indicators=this.model.shan.baopai;
   h.garnetUra=this.model.shan.fubaopai || [];
   h.winningTile=M.Shoupai.fromString(h.shoupai)._zimo;
   h.unlockedYaku=this._rule.unlockedYaku;
   h.unlockedChips=(h.hupai||[]).some(y=>y.name===h.unlockedYaku)?5:0;
   const n=bonus(h,this.model.defen[winner],this._rule.unlockedYaku);transfer(this.chips,winner,loser,n);
   const victims=[];
   for(let seat=0;seat<4;seat++) {
    const id=ids[seat];
    if(this.model.defen[id]>=0 && this.model.defen[id]+h.fenpei[seat]<0 && !this.busted.has(id)) {
     transfer(this.chips,winner,id,10);this.busted.add(id);victims.push(id);
    }
   }
   h.jewelChips=n;h.tobi=victims;this.bonusLog.push({winner,loser,n,victims});
  }
  super.add_paipu(msg);
 }
 last() { if(this.model.defen.some(n=>n>=55000)) {this.cold=true;return this.delay(()=>this.jieju(),0);}return super.last(); }
 jieju() {this._paipu.bonusChips=this.chips.slice();this._paipu.cold=!!this.cold;return super.jieju();}
}
function settle(paipu) {return paipu.defen.map((points,id)=>({id,points,rank:paipu.rank[id],rankChips:PAYOUT[paipu.rank[id]-1],bonusChips:paipu.bonusChips?.[id]||0}));}
function saveResult(storage,id,results) {
 const key='jewel-offline-results-v1'; let record;
 try {record=JSON.parse(storage.getItem(key)||'{"games":[],"totals":{}}');}catch{throw Error('保存データを読み取れません。既存データは変更していません。');}
 if(!record||!Array.isArray(record.games)||!record.totals)throw Error('保存データの形式が不正です');
 if(record.games.some(g=>g.id===id))return record;
 for(const r of results){const t=record.totals[r.id]||{rankChips:0,bonusChips:0,games:0};record.totals[r.id]={rankChips:t.rankChips+r.rankChips,bonusChips:t.bonusChips+r.bonusChips,games:t.games+1};}
 record.games.push({id,at:new Date().toISOString(),results});storage.setItem(key,JSON.stringify(record));return record;
}
module.exports={M,UNLOCK_YAKU,indicatorNumber,garnetValue,rule,actions,cpu,Player,Game,bonus,transfer,settle,saveResult};
